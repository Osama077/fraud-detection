from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.models import UserRole, AlertSeverity, AlertStatus, AlgorithmType


# ═══════════════════════════════════════════════════════════
# AUTH SCHEMAS
# ═══════════════════════════════════════════════════════════
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=2, max_length=100)
    role: UserRole = UserRole.analyst


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefresh(BaseModel):
    refresh_token: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# TRANSACTION SCHEMAS
# ═══════════════════════════════════════════════════════════
class TransactionCreate(BaseModel):
    time_seconds: float = Field(ge=0)
    amount: float = Field(gt=0)
    v1: float; v2: float; v3: float; v4: float
    v5: float; v6: float; v7: float; v8: float
    v9: float; v10: float; v11: float; v12: float
    v13: float; v14: float; v15: float; v16: float
    v17: float; v18: float; v19: float; v20: float
    v21: float; v22: float; v23: float; v24: float
    v25: float; v26: float; v27: float; v28: float

    def to_feature_list(self) -> List[float]:
        return [
            self.time_seconds,
            self.v1, self.v2, self.v3, self.v4, self.v5, self.v6, self.v7,
            self.v8, self.v9, self.v10, self.v11, self.v12, self.v13, self.v14,
            self.v15, self.v16, self.v17, self.v18, self.v19, self.v20, self.v21,
            self.v22, self.v23, self.v24, self.v25, self.v26, self.v27, self.v28,
            self.amount,
        ]


class TransactionOut(BaseModel):
    id: UUID
    time_seconds: float
    amount: float
    true_label: Optional[int]
    source: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
# PREDICTION SCHEMAS
# ═══════════════════════════════════════════════════════════
class PredictionResult(BaseModel):
    prediction_id: UUID
    transaction_id: UUID
    predicted_label: int          # 0 = legitimate, 1 = fraud
    fraud_probability: float
    decision_threshold: float
    is_fraud: bool
    alert_id: Optional[UUID]
    latency_ms: float
    model_version: str

    model_config = {"from_attributes": True}


class PredictionOut(BaseModel):
    id: UUID
    transaction_id: UUID
    predicted_label: int
    fraud_probability: float
    is_correct: Optional[bool]
    latency_ms: Optional[float]
    predicted_at: datetime

    model_config = {"from_attributes": True}


class BatchJobStatus(BaseModel):
    job_id: str
    status: str    # pending | started | completed | failed
    total: Optional[int] = None
    processed: Optional[int] = None
    fraud_count: Optional[int] = None


# ═══════════════════════════════════════════════════════════
# ALERT SCHEMAS
# ═══════════════════════════════════════════════════════════
class AlertOut(BaseModel):
    id: UUID
    prediction_id: UUID
    severity: AlertSeverity
    status: AlertStatus
    assigned_to: Optional[UUID]
    notes: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertUpdate(BaseModel):
    status: Optional[AlertStatus] = None
    assigned_to: Optional[UUID] = None
    notes: Optional[str] = None


# ═══════════════════════════════════════════════════════════
# MODEL VERSION SCHEMAS
# ═══════════════════════════════════════════════════════════
class ModelVersionOut(BaseModel):
    id: UUID
    version_tag: str
    algorithm: AlgorithmType
    precision_score: Optional[float]
    recall_score: Optional[float]
    f1_score: Optional[float]
    auc_roc: Optional[float]
    smote_applied: bool
    hyperparams: dict
    is_active: bool
    trained_at: datetime

    model_config = {"from_attributes": True}


# ═══════════════════════════════════════════════════════════
# ANALYTICS SCHEMAS
# ═══════════════════════════════════════════════════════════
class DashboardStats(BaseModel):
    total_transactions: int
    total_fraud: int
    fraud_rate: float
    precision: Optional[float]
    recall: Optional[float]
    auc_roc: Optional[float]
    open_alerts: int
    today_transactions: int
    today_fraud: int


class HealthStatus(BaseModel):
    status: str
    database: str
    redis: str
    ml_model: str
    version: str


# ═══════════════════════════════════════════════════════════
# ADMIN SCHEMAS
# ═══════════════════════════════════════════════════════════
class UserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    full_name: Optional[str] = None


class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[UUID]
    action: str
    resource_type: Optional[str]
    resource_id: Optional[UUID]
    metadata: dict
    ip_address: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TrendPoint(BaseModel):
    label: str
    transactions: int
    fraud: int
    fraud_rate: float
