import asyncio
import pandas as pd
from io import StringIO
from celery import shared_task
from sqlalchemy import select
from app.core.celery_app import celery_app
from app.db.session import AsyncSessionLocal
from app.models.models import Transaction, Prediction, FraudAlert, AlertStatus
from app.ml.model_registry import model_registry
from app.services.prediction_service import _severity_from_prob
import uuid
from datetime import datetime, timezone
import time


@celery_app.task(bind=True, name="tasks.batch_predict")
def batch_predict_task(self, csv_content: str, user_id: str):
    """Celery task: parse CSV, run batch inference, store results."""
    self.update_state(state="STARTED", meta={"processed": 0, "total": 0})

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(_async_batch_predict(self, csv_content, user_id))
    loop.close()
    return result


async def _async_batch_predict(task, csv_content: str, user_id: str):
    df = pd.read_csv(StringIO(csv_content))

    required_cols = ["Time", "Amount"] + [f"V{i}" for i in range(1, 29)]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        return {"status": "failed", "error": f"Missing columns: {missing}"}

    total = len(df)
    task.update_state(state="STARTED", meta={"processed": 0, "total": total})

    fraud_count = 0
    uid = uuid.UUID(user_id)

    async with AsyncSessionLocal() as db:
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
                features_matrix.append([float(row["Time"]), float(row["Amount"])] + v_features)

            await db.flush()  # get IDs

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
                await db.flush()

                if label == 1:
                    fraud_count += 1
                    alert = FraudAlert(
                        prediction_id=pred.id,
                        severity=_severity_from_prob(float(prob)),
                        status=AlertStatus.open,
                    )
                    db.add(alert)

            await db.commit()

        except Exception as e:
            await db.rollback()
            return {"status": "failed", "error": str(e)}

    return {
        "status": "completed",
        "total": total,
        "fraud_count": fraud_count,
        "legitimate_count": total - fraud_count,
        "fraud_rate": round(fraud_count / total, 4) if total > 0 else 0,
    }
