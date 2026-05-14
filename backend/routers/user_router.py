from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from dtos.user import CommissionSummary, UserCreate, UserResponse
from models.user import User
from repositories.moncash_repository import MonCashRepository
from repositories.user_repository import UserRepository
from services.user_service import UserService


router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(UserRepository(db))


@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, service: UserService = Depends(get_user_service)):
    return service.create_new_user(user=user)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Mon profil",
)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get(
    "/me/commission-summary",
    response_model=CommissionSummary,
    summary="Mon total de commission dû à la plateforme",
)
def get_commission_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    repo = MonCashRepository(db)
    total_owed, count, volume = repo.commission_summary_for_user(current_user.id)
    return CommissionSummary(
        commission_rate=current_user.commission_rate,
        total_commission_owed=total_owed,
        successful_transactions_count=count,
        total_volume=volume,
    )
