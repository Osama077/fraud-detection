from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, get_registry
from app.schemas.schemas import TransactionCreate, PredictionResult, BatchJobStatus
from app.services.prediction_service import PredictionService
from app.services.tasks import batch_predict_task
from app.ml.model_registry import ModelRegistry
from app.models.models import User
from app.core.rate_limit import limiter
from celery.result import AsyncResult

router = APIRouter(prefix="/predict", tags=["Predictions"])


@router.post("/single", response_model=PredictionResult)
@limiter.limit("100/minute")
async def predict_single(
    request: Request,
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    registry: ModelRegistry = Depends(get_registry),
):
    """Predict a single transaction. Returns label, probability, and alert_id if fraud."""
    svc = PredictionService(db, registry)
    return await svc.predict_single(data, current_user.id)


@router.post("/batch", response_model=BatchJobStatus, status_code=202)
@limiter.limit("10/minute")
async def predict_batch(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    registry: ModelRegistry = Depends(get_registry),
):
    """Upload a CSV file for async batch prediction. Returns a job_id to poll."""
    if not registry.is_loaded():
        raise HTTPException(status_code=503, detail="No active ML model")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")

    contents = await file.read()
    if len(contents) > 100 * 1024 * 1024:  # 100 MB limit
        raise HTTPException(status_code=413, detail="File too large (max 100 MB)")

    csv_text = contents.decode("utf-8")
    task = batch_predict_task.delay(csv_text, str(current_user.id))

    return BatchJobStatus(job_id=task.id, status="pending")


@router.get("/batch/{job_id}", response_model=BatchJobStatus)
async def batch_status(job_id: str):
    """Poll the status of a batch prediction job."""
    result = AsyncResult(job_id)
    if result.state == "PENDING":
        return BatchJobStatus(job_id=job_id, status="pending")
    elif result.state == "STARTED":
        meta = result.info or {}
        return BatchJobStatus(job_id=job_id, status="started",
                              processed=meta.get("processed"), total=meta.get("total"))
    elif result.state == "SUCCESS":
        info = result.result or {}
        if info.get("status") == "failed":
            return BatchJobStatus(job_id=job_id, status="failed")
        return BatchJobStatus(
            job_id=job_id, status="completed",
            total=info.get("total"),
            processed=info.get("total"),
            fraud_count=info.get("fraud_count"),
        )
    else:
        return BatchJobStatus(job_id=job_id, status="failed")
