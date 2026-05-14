from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Authentication Tokens
class MonCashTokenResponse(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    scope: Optional[str] = None

# Payment Creation
class MonCashPaymentCreate(BaseModel):
    amount: float
    orderId: str

class MonCashTokenInfo(BaseModel):
    expired: str
    created: str
    token: str

class MonCashPaymentResponse(BaseModel):
    path: str
    payment_token: MonCashTokenInfo
    timestamp: int
    status: int
    mode: str
    # URL hébergée MonCash sur laquelle rediriger le payeur.
    # Construite par MonCashService côté serveur, pas par Digicel.
    payment_url: Optional[str] = None


class TransactionResponse(BaseModel):
    """Représentation d'une transaction pour le dashboard utilisateur."""
    id: int
    order_id: Optional[str] = None
    transaction_id: Optional[str] = None
    payment_token: Optional[str] = None
    amount: float
    currency: str = "HTG"
    status: str
    payer_phone: Optional[str] = None
    description: Optional[str] = None
    transaction_type: str
    environment: Optional[str] = None
    payment_url: Optional[str] = None
    commission_rate: Optional[float] = None
    commission_amount: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Payment Retrieval
class MonCashPaymentDetails(BaseModel):
    reference: str
    transaction_id: str
    cost: float
    message: str
    payer: str

class MonCashPaymentDetailsResponse(BaseModel):
    path: str
    payment: MonCashPaymentDetails
    timestamp: int
    status: int

# Customer Status
class MonCashCustomerStatusRequest(BaseModel):
    account: str

class MonCashCustomerStatusInfo(BaseModel):
    type: str
    status: List[str]

class MonCashCustomerStatusResponse(BaseModel):
    path: str
    customerStatus: MonCashCustomerStatusInfo
    timestamp: int
    status: int
    mode: Optional[str] = None

# Transfer/Payout
class MonCashTransferRequest(BaseModel):
    amount: float
    receiver: str
    desc: str
    reference: str

class MonCashTransferInfo(BaseModel):
    transaction_id: str
    amount: float
    receiver: str
    message: str
    desc: str

class MonCashTransferResponse(BaseModel):
    path: str
    transfer: MonCashTransferInfo
    timestamp: int
    status: int

# Prefunded Status
class MonCashPrefundedStatusRequest(BaseModel):
    reference: str

class MonCashPrefundedStatusResponse(BaseModel):
    path: str
    transStatus: str
    timestamp: int
    status: int
    error: Optional[str] = None
    message: Optional[str] = None

# Balance
class MonCashBalanceInfo(BaseModel):
    balance: float
    message: str

class MonCashBalanceResponse(BaseModel):
    path: str
    balance: MonCashBalanceInfo
    timestamp: int
    status: int
