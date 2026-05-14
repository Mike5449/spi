from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from dtos.moncash import TransactionResponse
from models.user import User
from repositories.moncash_repository import MonCashRepository
from services.transactions_service import TransactionsService


router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get(
    "/",
    response_model=List[TransactionResponse],
    summary="Liste mes transactions",
)
def list_my_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = MonCashRepository(db)
    return repo.list_for_user(user_id=current_user.id, skip=skip, limit=limit)


@router.post(
    "/{tx_id}/refresh-status",
    response_model=TransactionResponse,
    summary="Interroger MonCash sur l'état réel d'une transaction",
)
async def refresh_status(
    tx_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = TransactionsService(db)
    return await service.refresh_status(tx_id=tx_id, user_id=current_user.id)
