from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class ApiKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Nom donné par l'utilisateur ("boutique en ligne", "app mobile", ...)
    name = Column(String, nullable=False)

    # SHA-256 hex de la clé complète. La clé claire n'est jamais stockée.
    key_hash = Column(String, nullable=False, unique=True, index=True)

    # 16 premiers caractères de la clé (incluant le préfixe) pour l'affichage dans le dashboard.
    # Exemple : "mc_sandbox_a1b2c"
    key_prefix = Column(String, nullable=False)

    # "sandbox" ou "live"
    environment = Column(String, nullable=False, index=True)

    # Credentials MonCash chiffrés (Fernet). Toujours présents :
    # - sandbox : copie des credentials globaux de la plateforme
    # - live    : credentials fournis par l'utilisateur
    moncash_client_id_enc = Column(String, nullable=False)
    moncash_client_secret_enc = Column(String, nullable=False)

    # URL où rediriger le client après un paiement réussi sur MonCash.
    redirect_url = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_used_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)

    # Relation inverse (facultative)
    # user = relationship("User", back_populates="api_keys")

    __table_args__ = (
        Index("ix_api_keys_user_active", "user_id", "revoked_at"),
    )

    @property
    def is_active(self) -> bool:
        return self.revoked_at is None
