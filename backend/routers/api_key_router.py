from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from core.dependencies import get_current_user
from database import get_db
from dtos.api_key import ApiKeyCreate, ApiKeyCreatedResponse, ApiKeyResponse
from models.user import User
from repositories.api_key_repository import ApiKeyRepository
from services.api_key_service import ApiKeyService


router = APIRouter(prefix="/api-keys", tags=["api-keys"])


def get_api_key_service(db: Session = Depends(get_db)) -> ApiKeyService:
    return ApiKeyService(ApiKeyRepository(db))


def _to_response(record) -> ApiKeyResponse:
    return ApiKeyResponse(
        id=record.id,
        name=record.name,
        key_prefix=record.key_prefix,
        environment=record.environment,
        redirect_url=record.redirect_url,
        created_at=record.created_at,
        last_used_at=record.last_used_at,
        revoked_at=record.revoked_at,
        is_active=record.revoked_at is None,
    )


@router.post(
    "/",
    response_model=ApiKeyCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Générer une nouvelle clé API",
)
def create_api_key(
    payload: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
):
    record, raw_key = service.create_for_user(user_id=current_user.id, payload=payload)
    base = _to_response(record).model_dump()
    return ApiKeyCreatedResponse(**base, key=raw_key)


@router.get(
    "/",
    response_model=List[ApiKeyResponse],
    summary="Lister mes clés API",
)
def list_api_keys(
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
):
    records = service.list_for_user(current_user.id)
    return [_to_response(r) for r in records]


@router.delete(
    "/{key_id}",
    response_model=ApiKeyResponse,
    summary="Révoquer une clé API",
)
def revoke_api_key(
    key_id: int,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service),
):
    record = service.revoke_for_user(user_id=current_user.id, key_id=key_id)
    return _to_response(record)
