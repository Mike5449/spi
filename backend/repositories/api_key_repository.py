from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from models.api_key import ApiKey


class ApiKeyRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        user_id: int,
        name: str,
        key_hash: str,
        key_prefix: str,
        environment: str,
        moncash_client_id_enc: str,
        moncash_client_secret_enc: str,
        redirect_url: Optional[str] = None,
    ) -> ApiKey:
        item = ApiKey(
            user_id=user_id,
            name=name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            environment=environment,
            moncash_client_id_enc=moncash_client_id_enc,
            moncash_client_secret_enc=moncash_client_secret_enc,
            redirect_url=redirect_url,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def get_by_hash(self, key_hash: str) -> Optional[ApiKey]:
        return self.db.query(ApiKey).filter(ApiKey.key_hash == key_hash).first()

    def get_by_id_for_user(self, key_id: int, user_id: int) -> Optional[ApiKey]:
        return (
            self.db.query(ApiKey)
            .filter(ApiKey.id == key_id, ApiKey.user_id == user_id)
            .first()
        )

    def list_for_user(self, user_id: int) -> List[ApiKey]:
        return (
            self.db.query(ApiKey)
            .filter(ApiKey.user_id == user_id)
            .order_by(ApiKey.created_at.desc())
            .all()
        )

    def counts_for_user(self, user_id: int) -> tuple[int, int]:
        """Retourne (total_keys, active_keys) pour un utilisateur."""
        from sqlalchemy import func
        total = (
            self.db.query(func.count(ApiKey.id))
            .filter(ApiKey.user_id == user_id)
            .scalar()
        ) or 0
        active = (
            self.db.query(func.count(ApiKey.id))
            .filter(ApiKey.user_id == user_id, ApiKey.revoked_at.is_(None))
            .scalar()
        ) or 0
        return int(total), int(active)

    def revoke(self, item: ApiKey) -> ApiKey:
        item.revoked_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(item)
        return item

    def touch_last_used(self, item: ApiKey) -> None:
        item.last_used_at = datetime.utcnow()
        self.db.commit()
