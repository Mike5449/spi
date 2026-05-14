from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from core.dependencies import require_super_admin
from database import get_db
from dtos.moncash import TransactionResponse
from dtos.user import (
    ApiKeySummaryAdmin,
    CommissionUpdate,
    UserDetailAdmin,
    UserListAdminItem,
    UserResponse,
)
from repositories.api_key_repository import ApiKeyRepository
from repositories.moncash_repository import MonCashRepository
from repositories.user_repository import UserRepository


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_super_admin)],
)


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def _build_list_item(user, tx_stats: dict, total_keys: int, active_keys: int) -> UserListAdminItem:
    return UserListAdminItem(
        id=user.id,
        username=user.username,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        role=user.role,
        commission_rate=user.commission_rate,
        total_commission_owed=tx_stats["total_commission_owed"],
        total_volume_successful=tx_stats["total_volume_successful"],
        successful_transactions_count=tx_stats["successful_count"],
        failed_transactions_count=tx_stats["failed_count"],
        pending_transactions_count=tx_stats["pending_count"],
        api_keys_count=total_keys,
        active_api_keys_count=active_keys,
    )


# -----------------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------------

@router.get(
    "/users",
    response_model=List[UserListAdminItem],
    summary="Lister tous les utilisateurs avec leurs totaux",
)
def list_users(db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    tx_repo = MonCashRepository(db)
    key_repo = ApiKeyRepository(db)
    users = user_repo.list_all()

    items: List[UserListAdminItem] = []
    for u in users:
        stats = tx_repo.stats_for_user(u.id)
        total_keys, active_keys = key_repo.counts_for_user(u.id)
        items.append(_build_list_item(u, stats, total_keys, active_keys))
    return items


@router.get(
    "/users/{user_id}",
    response_model=UserDetailAdmin,
    summary="Détail complet d'un utilisateur (avec clés API)",
)
def get_user_detail(user_id: int, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    tx_repo = MonCashRepository(db)
    key_repo = ApiKeyRepository(db)

    user = user_repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    stats = tx_repo.stats_for_user(user.id)
    keys = key_repo.list_for_user(user.id)
    total_keys = len(keys)
    active_keys = sum(1 for k in keys if k.revoked_at is None)
    base = _build_list_item(user, stats, total_keys, active_keys)

    return UserDetailAdmin(
        **base.model_dump(),
        api_keys=[ApiKeySummaryAdmin.model_validate(k) for k in keys],
    )


@router.get(
    "/users/{user_id}/transactions",
    response_model=List[TransactionResponse],
    summary="Transactions d'un utilisateur (vue admin)",
)
def list_user_transactions(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    user_repo = UserRepository(db)
    if not user_repo.get_user_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    tx_repo = MonCashRepository(db)
    return tx_repo.list_for_user(user_id=user_id, skip=skip, limit=limit)


@router.patch(
    "/users/{user_id}/commission",
    response_model=UserResponse,
    summary="Modifier le taux de commission d'un utilisateur",
)
def update_user_commission(
    user_id: int,
    payload: CommissionUpdate,
    db: Session = Depends(get_db),
):
    repo = UserRepository(db)
    user = repo.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return repo.update_commission_rate(user, payload.commission_rate)
