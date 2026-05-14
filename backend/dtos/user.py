from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    # Téléphone (au minimum 7 chiffres). Formats acceptés : "509XXXXXXXX",
    # "+509 XX XX XXXX", etc.
    phone: str = Field(..., min_length=7, max_length=25)
    # role / commission_rate NE SONT PAS settable par le client à l'inscription.


class UserResponse(UserBase):
    id: int
    is_active: bool
    role: str
    commission_rate: float
    phone: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Vues admin ----------

class ApiKeySummaryAdmin(BaseModel):
    id: int
    name: str
    key_prefix: str
    environment: str
    redirect_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListAdminItem(UserResponse):
    """Ligne de la table admin (avec totaux agrégés)."""
    total_commission_owed: float = 0.0
    total_volume_successful: float = 0.0
    successful_transactions_count: int = 0
    failed_transactions_count: int = 0
    pending_transactions_count: int = 0
    api_keys_count: int = 0
    active_api_keys_count: int = 0


class UserDetailAdmin(UserListAdminItem):
    """Vue détaillée d'un utilisateur — toutes ses clés."""
    api_keys: List[ApiKeySummaryAdmin] = []


class CommissionUpdate(BaseModel):
    """Payload pour modifier le taux de commission d'un utilisateur."""
    commission_rate: float = Field(..., ge=0.0, le=100.0)


# ---------- Vue self-service ----------

class CommissionSummary(BaseModel):
    """Résumé pour l'utilisateur courant (visible dans son dashboard)."""
    commission_rate: float
    total_commission_owed: float
    successful_transactions_count: int
    total_volume: float
