"""
Génération et gestion des clés API utilisateur.

Format : mc_sandbox_<32 chars urlsafe>  ou  mc_live_<32 chars urlsafe>
- Le prefix permet d'identifier rapidement l'environnement
- Le hash SHA-256 sert au lookup en O(1) lors des appels MonCash
- Les credentials MonCash sont chiffrés (Fernet) et stockés par clé
"""
import hashlib
import secrets
from typing import List

from core.encryption import encrypt
from core.exceptions import ApiKeyNotFoundException
from dtos.api_key import ApiKeyCreate
from models.api_key import ApiKey
from repositories.api_key_repository import ApiKeyRepository


def _hash_key(key: str) -> str:
    """SHA-256 hex de la clé entière. Rapide, suffisant car la clé est cryptographiquement aléatoire."""
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def _generate_raw_key(environment: str) -> str:
    """Génère une clé du type `mc_sandbox_xxx...` ou `mc_live_xxx...`."""
    prefix = "mc_sandbox_" if environment == "sandbox" else "mc_live_"
    # token_urlsafe(24) renvoie ~32 caractères URL-safe (192 bits d'entropie)
    return prefix + secrets.token_urlsafe(24)


class ApiKeyService:
    def __init__(self, repository: ApiKeyRepository):
        self.repo = repository

    def create_for_user(self, *, user_id: int, payload: ApiKeyCreate) -> tuple[ApiKey, str]:
        """
        Crée une nouvelle clé API pour l'utilisateur.
        Les credentials MonCash (client_id + client_secret) sont fournis par l'utilisateur
        — sandbox comme live. En sandbox, la plateforme transmet manuellement les
        credentials sandbox à l'utilisateur hors-app.
        Retourne (record_db, clé_en_clair). La clé en clair n'est plus jamais lisible après.
        """
        # 1) Générer la clé claire + dériver hash + prefix
        raw_key = _generate_raw_key(payload.environment)
        key_hash = _hash_key(raw_key)
        key_prefix = raw_key[:16]  # ex: "mc_sandbox_a1b2c"

        # 2) Persister avec les credentials chiffrés
        record = self.repo.create(
            user_id=user_id,
            name=payload.name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            environment=payload.environment,
            moncash_client_id_enc=encrypt(payload.client_id),
            moncash_client_secret_enc=encrypt(payload.client_secret),
            redirect_url=str(payload.redirect_url) if payload.redirect_url else None,
        )
        return record, raw_key

    def list_for_user(self, user_id: int) -> List[ApiKey]:
        return self.repo.list_for_user(user_id)

    def revoke_for_user(self, *, user_id: int, key_id: int) -> ApiKey:
        record = self.repo.get_by_id_for_user(key_id, user_id)
        if not record:
            raise ApiKeyNotFoundException()
        if record.revoked_at is not None:
            return record  # déjà révoquée
        return self.repo.revoke(record)

    @staticmethod
    def hash_key(key: str) -> str:
        return _hash_key(key)
