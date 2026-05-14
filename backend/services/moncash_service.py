import asyncio
import base64
from typing import Any, Awaitable, Callable, Dict

import httpx
from fastapi import HTTPException, status

from core.dependencies import MonCashContext
from dtos.moncash import (
    MonCashCustomerStatusRequest,
    MonCashPaymentCreate,
    MonCashPrefundedStatusRequest,
    MonCashTransferRequest,
)
from repositories.moncash_repository import MonCashRepository


# Erreurs httpx considérées comme transitoires (réseau / serveur lent / déconnexion brutale)
_TRANSIENT_EXC = (
    httpx.ConnectError,
    httpx.ReadError,
    httpx.WriteError,
    httpx.RemoteProtocolError,
    httpx.PoolTimeout,
    httpx.ConnectTimeout,
    httpx.ReadTimeout,
    httpx.WriteTimeout,
)

# Timeout généreux : MonCash sandbox peut prendre 10-20s pour répondre
_HTTPX_TIMEOUT = httpx.Timeout(connect=15.0, read=60.0, write=15.0, pool=10.0)


async def _retry(
    fn: Callable[[], Awaitable[httpx.Response]],
    *,
    attempts: int = 3,
    base_delay: float = 0.5,
) -> httpx.Response:
    """
    Exécute `fn` avec retry sur les erreurs transitoires (déconnexion, timeout, etc.).
    Backoff exponentiel : 0.5s, 1s, 2s.
    Ne retry PAS sur les erreurs métier (4xx/5xx renvoyés par MonCash) — celles-là
    remontent telles quelles.
    """
    last_exc: Exception | None = None
    for i in range(attempts):
        try:
            return await fn()
        except _TRANSIENT_EXC as exc:
            last_exc = exc
            if i == attempts - 1:
                break
            await asyncio.sleep(base_delay * (2**i))
    # Si on arrive ici, tous les essais ont échoué
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=(
            f"MonCash unreachable after {attempts} attempts "
            f"({type(last_exc).__name__}: {last_exc}). "
            "The MonCash sandbox is occasionally slow or drops connections — please retry."
        ),
    )


class MonCashService:
    """
    Service MonCash : pilote par un MonCashContext (credentials résolus depuis la clé API
    de l'utilisateur). Plus aucune lecture directe des settings globaux ici.
    """

    def __init__(self, moncash_repository: MonCashRepository, ctx: MonCashContext):
        self.repository = moncash_repository
        self.ctx = ctx
        if ctx.environment == "live":
            self.base_url = "https://moncashbutton.digicelgroup.com/Api"
            self.gateway_url = "https://moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect"
        else:
            self.base_url = "https://sandbox.moncashbutton.digicelgroup.com/Api"
            self.gateway_url = "https://sandbox.moncashbutton.digicelgroup.com/Moncash-middleware/Payment/Redirect"

    def _build_payment_url(self, payment_token: str | None) -> str | None:
        """Construit l'URL hébergée MonCash sur laquelle rediriger le payeur."""
        if not payment_token:
            return None
        return f"{self.gateway_url}?token={payment_token}"

    # ---- OAuth client_credentials sur MonCash ----

    async def get_token(self) -> str:
        url = f"{self.base_url}/oauth/token"
        auth_str = f"{self.ctx.client_id}:{self.ctx.client_secret}"
        encoded_auth = base64.b64encode(auth_str.encode()).decode()

        headers = {
            "Authorization": f"Basic {encoded_auth}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
        }
        data = {"grant_type": "client_credentials", "scope": "read,write"}

        async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
            response = await _retry(lambda: client.post(url, headers=headers, data=data))

        if response.status_code != 200:
            error_msg = response.text
            if response.status_code == 401:
                error_msg = "Invalid Client ID or Client Secret"
            raise HTTPException(
                status_code=response.status_code,
                detail=f"MonCash Auth Error: {error_msg}",
            )
        return response.json().get("access_token")

    # ---- Paiements ----

    async def create_payment(self, payment_in: MonCashPaymentCreate) -> Dict[str, Any]:
        # 1) Token MonCash (peut raise — on enregistre alors la transaction comme failed)
        try:
            token = await self.get_token()
        except HTTPException as exc:
            self._safe_record_failure(
                order_id=payment_in.orderId,
                amount=payment_in.amount,
                description=f"MonCash auth failed: {exc.detail}",
            )
            raise

        url = f"{self.base_url}/v1/CreatePayment"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = payment_in.dict()

        try:
            async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
                response = await _retry(lambda: client.post(url, headers=headers, json=payload))
        except HTTPException as exc:
            # Retry épuisé / MonCash injoignable
            self._safe_record_failure(
                order_id=payment_in.orderId,
                amount=payment_in.amount,
                description=f"MonCash unreachable: {exc.detail}",
            )
            raise

        if response.status_code not in [200, 201, 202]:
            self._safe_record_failure(
                order_id=payment_in.orderId,
                amount=payment_in.amount,
                description=f"MonCash {response.status_code}: {response.text[:200]}",
            )
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to create MonCash payment: {response.text}",
            )
        resp_data = response.json()
        payment_token = (resp_data.get("payment_token") or {}).get("token")
        payment_url = self._build_payment_url(payment_token)

        # Enrichir la réponse pour que le client puisse rediriger directement
        resp_data["payment_url"] = payment_url

        self.repository.create_transaction({
            "user_id": self.ctx.user_id,
            "api_key_id": self.ctx.api_key_id,
            "order_id": payment_in.orderId,
            "amount": payment_in.amount,
            "payment_token": payment_token,
            "status": "created",
            "transaction_type": "payment",
            "environment": self.ctx.environment,
            "payment_url": payment_url,
        })
        return resp_data

    def _safe_record_failure(
        self,
        *,
        order_id: str,
        amount: float,
        description: str,
    ) -> None:
        """Enregistre une transaction en échec sans bloquer la requête sur erreur DB."""
        try:
            self.repository.create_transaction({
                "user_id": self.ctx.user_id,
                "api_key_id": self.ctx.api_key_id,
                "order_id": order_id,
                "amount": amount,
                "status": "failed",
                "transaction_type": "payment",
                "environment": self.ctx.environment,
                "description": description,
            })
        except Exception:
            pass  # best-effort — un échec MonCash ne doit pas être masqué par un échec DB

    async def retrieve_transaction_payment(self, transaction_id: str) -> Dict[str, Any]:
        token = await self.get_token()
        url = f"{self.base_url}/v1/RetrieveTransactionPayment"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
            response = await _retry(lambda: client.post(url, headers=headers, json={"transactionId": transaction_id}))
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to retrieve transaction: {response.text}",
                )
            return response.json()

    async def retrieve_order_payment(self, order_id: str) -> Dict[str, Any]:
        token = await self.get_token()
        url = f"{self.base_url}/v1/RetrieveOrderPayment"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
            response = await _retry(lambda: client.post(url, headers=headers, json={"orderId": order_id}))
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to retrieve order: {response.text}",
                )
            return response.json()

    async def get_customer_status(self, account: str) -> Dict[str, Any]:
        token = await self.get_token()
        url = f"{self.base_url}/v1/CustomerStatus"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
            response = await _retry(lambda: client.post(url, headers=headers, json={"account": account}))
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to get customer status: {response.text}",
                )
            return response.json()

    async def transfert(self, transfer_in: MonCashTransferRequest) -> Dict[str, Any]:
        token = await self.get_token()
        url = f"{self.base_url}/v1/Transfert"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = transfer_in.dict()
        async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
            response = await _retry(lambda: client.post(url, headers=headers, json=payload))
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to execute transfer: {response.text}",
                )
            resp_data = response.json()
            # On laisse la commission à None ici ; un super_admin / un script peut
            # la rétro-calculer plus tard si besoin. Les payouts sont rares et
            # l'utilisateur peut négocier un taux différent dessus.
            self.repository.create_transaction({
                "user_id": self.ctx.user_id,
                "api_key_id": self.ctx.api_key_id,
                "order_id": transfer_in.reference,
                "transaction_id": resp_data.get("transfer", {}).get("transaction_id"),
                "amount": transfer_in.amount,
                "status": "successful" if response.status_code == 200 else "failed",
                "transaction_type": "payout",
                "description": transfer_in.desc,
                "environment": self.ctx.environment,
            })
            return resp_data

    async def check_prefunded_transaction_status(self, reference: str) -> Dict[str, Any]:
        token = await self.get_token()
        url = f"{self.base_url}/v1/PrefundedTransactionStatus"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
            response = await _retry(lambda: client.post(url, headers=headers, json={"reference": reference}))
            if response.status_code not in [200, 404, 403]:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to check prefunded status: {response.text}",
                )
            return response.json()

    async def get_prefunded_balance(self) -> Dict[str, Any]:
        token = await self.get_token()
        url = f"{self.base_url}/v1/PrefundedBalance"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        async with httpx.AsyncClient(timeout=_HTTPX_TIMEOUT) as client:
            response = await _retry(lambda: client.get(url, headers=headers))
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Failed to get prefunded balance: {response.text}",
                )
            return response.json()
