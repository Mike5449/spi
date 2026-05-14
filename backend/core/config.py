from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SPI — Système de Paiement Intégré"

    # ---- Base de données ----
    # En prod : postgresql://user:pass@db:5432/spi
    # En dev local : sqlite:///./moncash_dev.db
    DATABASE_URL: str

    # ---- JWT (dashboard) ----
    # OBLIGATOIRE en prod — générer avec :
    #   python -c "import secrets;print(secrets.token_hex(32))"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h

    # ---- MonCash plateforme (transmis manuellement aux utilisateurs en sandbox) ----
    MONCASH_CLIENT_ID: str = ""
    MONCASH_CLIENT_SECRET: str = ""
    MONCASH_ENVIRONMENT: str = "sandbox"

    # ---- Chiffrement des credentials MonCash des utilisateurs ----
    # OBLIGATOIRE en prod — générer avec :
    #   python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())"
    FERNET_KEY: str

    # ---- CORS ----
    # Liste d'origines séparées par des virgules.
    # En prod, app servie depuis la même origine que l'API → CORS souvent
    # pas déclenché. Mais on garde les origines explicites pour les tests.
    CORS_ORIGINS: str = "http://localhost:8080,http://127.0.0.1:8080"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
