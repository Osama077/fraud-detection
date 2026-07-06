import os
import pandas as pd
from io import StringIO
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from celery.signals import worker_process_init
from app.core.celery_app import celery_app
from app.core.config import settings
from app.models.models import Transaction, Prediction, FraudAlert, AlertStatus
from app.ml.model_registry import model_registry
from app.services.prediction_service import _severity_from_prob
import uuid
import time


# ─── Model loading for Celery worker ─────────────────────────
def _load_model_for_worker():
    """Load the active ML model into the registry for the Celery worker process."""
    if model_registry.is_loaded():
        return

    artifacts = Path(settings.MODEL_ARTIFACTS_PATH)
    scaler_path = artifacts / "scaler.pkl"
    if not scaler_path.exists():
        return

    model_candidates = [
        ("random_forest.pkl", "v2.0.0"),
        ("xgboost.pkl", "v1.1.0"),
        ("logistic_regression.pkl", "v1.0.0"),
    ]

    for model_file, version_tag in model_candidates:
        mp = artifacts / model_file
        if not mp.exists():
            continue
        # Look up the model version ID from the DB
        db = _get_sync_session()
        try:
            from app.models.models import ModelVersion
            mv = db.query(ModelVersion).filter(ModelVersion.version_tag == version_tag).first()
            version_id = str(mv.id) if mv else version_tag
        except Exception:
            version_id = version_tag
        finally:
            db.close()

        model_registry.load(str(mp), str(scaler_path), version_tag, version_id)
        import logging
        logging.getLogger(__name__).info(f"[Celery] Loaded model {version_tag}")
        return


@worker_process_init.connect
def on_worker_init(**kwargs):
    _load_model_for_worker()


# ─── Sync DB session for Celery tasks ────────────────────────
_sync_engine = None
_SyncSessionLocal = None


def _get_sync_session() -> Session:
    global _sync_engine, _SyncSessionLocal
    if _sync_engine is None:
        sync_url = settings.DATABASE_URL.replace("+asyncpg", "+psycopg2")
        _sync_engine = create_engine(sync_url, pool_size=5, max_overflow=10, pool_pre_ping=True)
        _SyncSessionLocal = sessionmaker(bind=_sync_engine)
    return _SyncSessionLocal()


@celery_app.task(bind=True, name="tasks.batch_predict")
def batch_predict_task(self, csv_content: str, user_id: str):
    """Celery task: parse CSV, run batch inference, store results."""
    df = pd.read_csv(StringIO(csv_content))

    required_cols = ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        return {"status": "failed", "error": f"Missing columns: {missing}"}

    total = len(df)
    self.update_state(state="STARTED", meta={"processed": 0, "total": total})

    fraud_count = 0
    uid = uuid.UUID(user_id)

    db = _get_sync_session()
    try:
        transactions = []
        features_matrix = []

        for _, row in df.iterrows():
            v_features = [row[f"V{i}"] for i in range(1, 29)]
            tx = Transaction(
                time_seconds=float(row["Time"]),
                amount=float(row["Amount"]),
                v_features=v_features,
                true_label=int(row["Class"]) if "Class" in df.columns else None,
                source="upload",
                uploaded_by=uid,
            )
            db.add(tx)
            transactions.append(tx)
            features_matrix.append([float(row["Time"])] + v_features + [float(row["Amount"])])

        db.flush()  # get IDs

        # Batch inference
        t0 = time.perf_counter()
        labels, probas = model_registry.predict_batch(features_matrix)
        latency_total = (time.perf_counter() - t0) * 1000

        model_vid = uuid.UUID(model_registry.active_version_id)

        for tx, label, prob in zip(transactions, labels, probas):
            pred = Prediction(
                transaction_id=tx.id,
                model_version_id=model_vid,
                predicted_label=int(label),
                fraud_probability=float(prob),
                decision_threshold=model_registry.threshold,
                latency_ms=latency_total / total,
            )
            db.add(pred)
            db.flush()

            if label == 1:
                fraud_count += 1
                alert = FraudAlert(
                    prediction_id=pred.id,
                    severity=_severity_from_prob(float(prob)),
                    status=AlertStatus.open,
                )
                db.add(alert)

        db.commit()

    except Exception as e:
        db.rollback()
        return {"status": "failed", "error": str(e)}
    finally:
        db.close()

    return {
        "status": "completed",
        "total": total,
        "fraud_count": fraud_count,
        "legitimate_count": total - fraud_count,
        "fraud_rate": round(fraud_count / total, 4) if total > 0 else 0,
    }
