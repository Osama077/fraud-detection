import csv, io
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from datetime import datetime, timezone

from app.db.session import get_db
from app.api.deps import get_current_user
from app.schemas.schemas import AlertOut, AlertUpdate
from app.models.models import FraudAlert, AlertStatus, AlertSeverity, Prediction, User

router = APIRouter(prefix="/alerts", tags=["Fraud Alerts"])


@router.get("", response_model=List[AlertOut])
async def list_alerts(
    status: Optional[AlertStatus] = None,
    severity: Optional[AlertSeverity] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(FraudAlert)
    if status:
        q = q.where(FraudAlert.status == status)
    if severity:
        q = q.where(FraudAlert.severity == severity)
    q = q.order_by(FraudAlert.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{alert_id}", response_model=AlertOut)
async def get_alert(
    alert_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FraudAlert).where(FraudAlert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.put("/{alert_id}", response_model=AlertOut)
async def update_alert(
    alert_id: UUID,
    data: AlertUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(FraudAlert).where(FraudAlert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    if data.status:
        alert.status = data.status
        if data.status in (AlertStatus.resolved, AlertStatus.false_positive):
            alert.resolved_at = datetime.now(timezone.utc)
    if data.assigned_to is not None:
        alert.assigned_to = data.assigned_to
    if data.notes is not None:
        alert.notes = data.notes

    await db.flush()
    return alert


@router.get("/export")
async def export_alerts(
    status: Optional[AlertStatus] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Stream fraud alerts as CSV download."""
    q = (
        select(FraudAlert, Prediction)
        .join(Prediction, Prediction.id == FraudAlert.prediction_id)
        .order_by(FraudAlert.created_at.desc())
        .limit(50000)
    )
    if status:
        q = q.where(FraudAlert.status == status)

    result = await db.execute(q)
    rows   = result.fetchall()

    def generate():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([
            "alert_id", "severity", "status", "fraud_probability",
            "decision_threshold", "assigned_to", "notes",
            "resolved_at", "created_at",
        ])
        yield buf.getvalue(); buf.seek(0); buf.truncate(0)
        for alert, pred in rows:
            writer.writerow([
                str(alert.id), alert.severity, alert.status,
                round(pred.fraud_probability, 4), pred.decision_threshold,
                str(alert.assigned_to) if alert.assigned_to else "",
                alert.notes or "",
                alert.resolved_at.isoformat() if alert.resolved_at else "",
                alert.created_at.isoformat(),
            ])
            yield buf.getvalue(); buf.seek(0); buf.truncate(0)

    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fraud_alerts.csv"},
    )
