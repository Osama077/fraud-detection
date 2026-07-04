from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.core.config import settings
from app.db.session import engine, AsyncSessionLocal
from app.models.models import Base
from app.api.v1.endpoints import auth, predict, alerts, analytics, transactions, admin_users, audit_logs
from app.core.rate_limit import limiter, rate_limit_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.ml.model_registry import model_registry
from app.core.middleware import AuditMiddleware

import json
import uuid
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ─── Startup / Shutdown ───────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")

    # Ensure artifacts directory exists
    artifacts = Path(settings.MODEL_ARTIFACTS_PATH)
    artifacts.mkdir(parents=True, exist_ok=True)

    # Load active ML model if artifacts exist
    scaler_path = artifacts / "scaler.pkl"

    # Priority order: RF > XGB > LR
    model_candidates = [
        ("random_forest.pkl", "rf_metadata.json", "random_forest", "v2.0.0"),
        ("xgboost.pkl", "xgb_metadata.json", "xgboost", "v1.1.0"),
        ("logistic_regression.pkl", "lr_metadata.json", "logistic_regression", "v1.0.0"),
    ]
    model_path = None
    meta_path = None
    algo_name = None
    version_tag = None

    for model_file, meta_file, algo, tag in model_candidates:
        mp = artifacts / model_file
        if mp.exists() and scaler_path.exists():
            model_path = mp
            meta_path = artifacts / meta_file
            algo_name = algo
            version_tag = tag
            break

    if model_path is not None and scaler_path.exists():
        async with AsyncSessionLocal() as db:
            from app.models.models import ModelVersion, AlgorithmType
            from sqlalchemy import select

            hyperparams = {}
            if meta_path and meta_path.exists():
                with open(meta_path) as f:
                    hyperparams = json.load(f)

            result = await db.execute(
                select(ModelVersion).where(ModelVersion.version_tag == version_tag)
            )
            mv = result.scalar_one_or_none()
            if not mv:
                algo_enum = getattr(AlgorithmType, algo_name, AlgorithmType.logistic_regression)
                mv = ModelVersion(
                    id=uuid.uuid4(),
                    version_tag=version_tag,
                    algorithm=algo_enum,
                    artifact_path=str(model_path),
                    precision_score=hyperparams.get("precision"),
                    recall_score=hyperparams.get("recall"),
                    f1_score=hyperparams.get("f1"),
                    auc_roc=hyperparams.get("auc_roc"),
                    smote_applied=True,
                    hyperparams=hyperparams,
                    is_active=True,
                )
                db.add(mv)
                await db.commit()
                await db.refresh(mv)
                logger.info(f"Registered model {version_tag} in DB")

            model_registry.load(str(model_path), str(scaler_path), mv.version_tag, str(mv.id))
            logger.info(f"[Startup] Model loaded: {mv.version_tag} ({algo_name})")
    else:
        logger.warning("[Startup] No model artifacts found. Train the model first.")

    yield

    await engine.dispose()
    logger.info("App shutdown complete")


# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Credit Card Fraud Detection API — DEPI Graduation Project 2025",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(AuditMiddleware)

# ─── Routers ──────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"
app.include_router(auth.router,         prefix=PREFIX)
app.include_router(predict.router,      prefix=PREFIX)
app.include_router(alerts.router,       prefix=PREFIX)
app.include_router(transactions.router, prefix=PREFIX)
app.include_router(analytics.router,    prefix=PREFIX)
app.include_router(admin_users.router,  prefix=PREFIX)
app.include_router(audit_logs.router,   prefix=PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {"message": "FraudShield API", "docs": "/docs", "version": settings.VERSION}
