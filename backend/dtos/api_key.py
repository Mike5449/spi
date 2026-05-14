from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, HttpUrl


class ApiKeyCreate(BaseModel):
    """
    Création d'une clé API.
    L'utilisateur fournit TOUJOURS CLIENT_ID + CLIENT_SECRET, en sandbox comme en live.
    En sandbox, la plateforme transmet manuellement les credentials sandbox à l'utilisateur.
    """
    name: str = Field(..., min_length=1, max_length=100, description="Nom donné par l'utilisateur")
    environment: Literal["sandbox", "live"] = "sandbox"
    client_id: str = Field(..., min_length=1, max_length=200)
    client_secret: str = Field(..., min_length=1, max_length=200)
    # URL de redirection après paiement réussi (optionnelle)
    redirect_url: Optional[HttpUrl] = Field(
        default=None,
        description="URL où renvoyer le client après un paiement réussi sur MonCash.",
    )


class ApiKeyResponse(BaseModel):
    """Réponse listing — la clé en clair n'est PAS retournée."""
    id: int
    name: str
    key_prefix: str
    environment: str
    redirect_url: Optional[str] = None
    created_at: datetime
    last_used_at: Optional[datetime] = None
    revoked_at: Optional[datetime] = None
    is_active: bool

    class Config:
        from_attributes = True


class ApiKeyCreatedResponse(ApiKeyResponse):
    """Renvoyée une seule fois à la création — contient la clé en clair."""
    key: str = Field(..., description="Clé API en clair. Affichée UNE seule fois — non récupérable.")
