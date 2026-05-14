from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import MonCashContext, get_api_key_context
from database import get_db
from dtos.moncash import (
    MonCashBalanceResponse,
    MonCashCustomerStatusRequest,
    MonCashCustomerStatusResponse,
    MonCashPaymentCreate,
    MonCashPaymentDetailsResponse,
    MonCashPaymentResponse,
    MonCashPrefundedStatusRequest,
    MonCashPrefundedStatusResponse,
    MonCashTransferRequest,
    MonCashTransferResponse,
)
from repositories.moncash_repository import MonCashRepository
from services.moncash_service import MonCashService


router = APIRouter(prefix="/moncash", tags=["MonCash"])


def get_moncash_service(
    ctx: MonCashContext = Depends(get_api_key_context),
    db: Session = Depends(get_db),
) -> MonCashService:
    """
    Toutes les routes MonCash sont protégées par X-API-Key (ou Authorization: Bearer mc_xxx_...).
    Le service reçoit les credentials résolus depuis la clé API de l'utilisateur.
    """
    repository = MonCashRepository(db)
    return MonCashService(repository, ctx)


@router.post("/token", response_model=str)
async def get_token(service: MonCashService = Depends(get_moncash_service)):
    return await service.get_token()


@router.post("/create-payment", response_model=MonCashPaymentResponse)
async def create_payment(
    payment_in: MonCashPaymentCreate,
    service: MonCashService = Depends(get_moncash_service),
):
    return await service.create_payment(payment_in)


@router.post("/retrieve-transaction-payment", response_model=MonCashPaymentDetailsResponse)
async def retrieve_transaction_payment(
    transaction_id: str,
    service: MonCashService = Depends(get_moncash_service),
):
    return await service.retrieve_transaction_payment(transaction_id)


@router.post("/retrieve-order-payment", response_model=MonCashPaymentDetailsResponse)
async def retrieve_order_payment(
    order_id: str,
    service: MonCashService = Depends(get_moncash_service),
):
    return await service.retrieve_order_payment(order_id)


@router.post("/customer-status", response_model=MonCashCustomerStatusResponse)
async def get_customer_status(
    request: MonCashCustomerStatusRequest,
    service: MonCashService = Depends(get_moncash_service),
):
    return await service.get_customer_status(request.account)


@router.post("/transfert", response_model=MonCashTransferResponse)
async def transfert(
    transfer_in: MonCashTransferRequest,
    service: MonCashService = Depends(get_moncash_service),
):
    return await service.transfert(transfer_in)


@router.post("/prefunded-transaction-status", response_model=MonCashPrefundedStatusResponse)
async def check_prefunded_transaction_status(
    request: MonCashPrefundedStatusRequest,
    service: MonCashService = Depends(get_moncash_service),
):
    return await service.check_prefunded_transaction_status(request.reference)


@router.get("/prefunded-balance", response_model=MonCashBalanceResponse)
async def get_prefunded_balance(
    service: MonCashService = Depends(get_moncash_service),
):
    return await service.get_prefunded_balance()
