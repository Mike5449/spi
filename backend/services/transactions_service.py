"""
Service pour les opérations sur les transactions visibles dans le dashboard.
Logique principale : rafraîchir le statut d'une transaction "created" en interrogeant
MonCash via /RetrieveOrderPayment et mettre à jour la DB locale en conséquence.
"""
from typing import Optional

from fastapi import HTTPException, status as http_status
from sqlalchemy.orm import Session

from core.dependencies import MonCashContext
from core.encryption import decrypt
from models.api_key import ApiKey
from models.moncash import MonCashTransaction
from models.user import User
from repositories.moncash_repository import MonCashRepository
from services.moncash_service import MonCashService


class TransactionsService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MonCashRepository(db)

    def _get_owned_tx(self, tx_id: int, user_id: int) -> MonCashTransaction:
        tx: Optional[MonCashTransaction] = (
            self.db.query(MonCashTransaction)
            .filter(
                MonCashTransaction.id == tx_id,
                MonCashTransaction.user_id == user_id,
            )
            .first()
        )
        if not tx:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )
        return tx

    def _build_ctx_from_api_key(self, api_key_id: int) -> MonCashContext:
        key: Optional[ApiKey] = (
            self.db.query(ApiKey).filter(ApiKey.id == api_key_id).first()
        )
        if not key:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="API key associated with this transaction no longer exists",
            )
        if key.revoked_at is not None:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="API key associated with this transaction has been revoked",
            )
        try:
            client_id = decrypt(key.moncash_client_id_enc)
            client_secret = decrypt(key.moncash_client_secret_enc)
        except ValueError as exc:
            raise HTTPException(
                status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Cannot decrypt stored MonCash credentials: {exc}",
            )
        return MonCashContext(
            api_key_id=key.id,
            user_id=key.user_id,
            environment=key.environment,
            client_id=client_id,
            client_secret=client_secret,
        )

    async def refresh_status(self, *, tx_id: int, user_id: int) -> MonCashTransaction:
        """
        Interroge MonCash sur l'état réel du paiement et met à jour la DB.

        - status "successful" + transaction_id + payer_phone si MonCash confirme un paiement
        - status "failed" si MonCash retourne explicitement un échec
        - sinon on laisse "created" (paiement encore en attente)
        """
        tx = self._get_owned_tx(tx_id, user_id)

        if tx.status == "successful":
            return tx  # rien à faire

        if not tx.order_id:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Transaction has no order_id — cannot query MonCash",
            )

        if not tx.api_key_id:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Transaction has no associated API key",
            )

        ctx = self._build_ctx_from_api_key(tx.api_key_id)
        svc = MonCashService(self.repo, ctx)

        try:
            data = await svc.retrieve_order_payment(tx.order_id)
        except HTTPException as exc:
            # 404 → paiement pas encore confirmé côté MonCash, on garde l'état "created"
            if exc.status_code == http_status.HTTP_404_NOT_FOUND:
                return tx
            raise

        # MonCash a répondu 2xx → analyser la charge utile
        payment_info = (data or {}).get("payment") or {}
        new_transaction_id = payment_info.get("transaction_id")
        new_payer = payment_info.get("payer")
        message = (payment_info.get("message") or "").lower()

        if new_transaction_id:
            # On a un transaction_id côté MonCash → considéré comme réussi.
            # On verrouille le taux de commission de l'utilisateur au moment du succès.
            user: User | None = (
                self.db.query(User).filter(User.id == tx.user_id).first()
                if tx.user_id else None
            )
            rate = float(user.commission_rate) if user else 0.0
            commission_amount = round((tx.amount or 0.0) * rate / 100.0, 4)

            self.repo.update_transaction(tx, {
                "status": "successful",
                "transaction_id": new_transaction_id,
                "payer_phone": new_payer,
                "description": message or tx.description,
                "commission_rate": rate,
                "commission_amount": commission_amount,
            })
        elif message and any(k in message for k in ("fail", "expired", "cancel")):
            self.repo.update_transaction(tx, {
                "status": "failed",
                "description": message,
            })
        # sinon, on laisse en "created"

        self.db.refresh(tx)
        return tx
