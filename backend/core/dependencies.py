"""
Dependencies FastAPI partagées.

Deux schémas d'auth distincts :
- `get_current_user` (JWT Bearer)  → endpoints dashboard (api-keys, profil utilisateur, ...)
- `get_api_key_context` (X-API-Key) → endpoints d'usage MonCash (/moncash/*)
"""
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, Header, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.encryption import decrypt
from core.exceptions import InvalidApiKeyException
from database import get_db
from models.api_key import ApiKey
from models.user import User
from repositories.api_key_repository import ApiKeyRepository
from repositories.user_repository import UserRepository
from services.api_key_service import ApiKeyService


# -----------------------------------------------------------------------------
# JWT : utilisateur courant (pour le dashboard)
# -----------------------------------------------------------------------------

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = UserRepository(db).get_user_by_username(username=username)
    if user is None or not user.is_active:
        raise credentials_exc
    return user


def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Guard pour les endpoints réservés aux super-administrateurs."""
    if current_user.role != "super_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super admin role required",
        )
    return current_user


# -----------------------------------------------------------------------------
# X-API-Key : contexte MonCash (credentials chiffrés résolus en clair pour la requête)
# -----------------------------------------------------------------------------

@dataclass
class MonCashContext:
    """Tout ce que MonCashService a besoin pour une requête, dérivé de la clé API utilisateur."""
    api_key_id: int
    user_id: int
    environment: str  # "sandbox" | "live"
    client_id: str
    client_secret: str
    redirect_url: Optional[str] = None  # URL retour configurée sur la clé API


def _extract_api_key(request: Request, x_api_key: Optional[str]) -> Optional[str]:
    """
    Accepte la clé :
    - dans l'en-tête `X-API-Key: mc_xxx_yyy`
    - OU dans `Authorization: Bearer mc_xxx_yyy` (préfixe `mc_` requis pour distinguer du JWT)
    """
    if x_api_key:
        return x_api_key.strip()
    auth = request.headers.get("Authorization") or ""
    if auth.lower().startswith("bearer "):
        candidate = auth[7:].strip()
        if candidate.startswith("mc_"):
            return candidate
    return None


def get_api_key_context(
    request: Request,
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> MonCashContext:
    raw_key = _extract_api_key(request, x_api_key)
    if not raw_key:
        raise InvalidApiKeyException(detail="Missing X-API-Key header")

    key_hash = ApiKeyService.hash_key(raw_key)
    repo = ApiKeyRepository(db)
    record: Optional[ApiKey] = repo.get_by_hash(key_hash)
    if not record or record.revoked_at is not None:
        raise InvalidApiKeyException()

    # Best-effort : mettre à jour last_used_at sans bloquer la requête en cas d'erreur
    try:
        repo.touch_last_used(record)
    except Exception:
        pass

    try:
        client_id = decrypt(record.moncash_client_id_enc)
        client_secret = decrypt(record.moncash_client_secret_enc)
    except ValueError:
        raise InvalidApiKeyException(detail="Cannot decrypt stored MonCash credentials")

    return MonCashContext(
        api_key_id=record.id,
        user_id=record.user_id,
        environment=record.environment,
        client_id=client_id,
        client_secret=client_secret,
        redirect_url=record.redirect_url,
    )
