"""
Chiffrement symétrique des secrets stockés en base (credentials MonCash).
Utilise Fernet (AES-128-CBC + HMAC-SHA256 d'après la spec, rotation native).
"""
from cryptography.fernet import Fernet, InvalidToken
from core.config import settings


def _cipher() -> Fernet:
    key = settings.FERNET_KEY
    if isinstance(key, str):
        key = key.encode("utf-8")
    return Fernet(key)


def encrypt(plaintext: str) -> str:
    """Chiffre une chaîne UTF-8 et renvoie le token Fernet en str (urlsafe-base64)."""
    if plaintext is None:
        raise ValueError("Cannot encrypt None")
    return _cipher().encrypt(plaintext.encode("utf-8")).decode("utf-8")


def decrypt(token: str) -> str:
    """Déchiffre un token Fernet. Lève ValueError si invalide."""
    try:
        return _cipher().decrypt(token.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise ValueError("Invalid or tampered encrypted token") from exc
