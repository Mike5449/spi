from sqlalchemy import Boolean, Column, Float, Integer, String
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    # Téléphone (utilisé pour l'envoi des credentials sandbox par WhatsApp et
    # comme numéro de test pour les paiements sandbox).
    phone = Column(String, nullable=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

    # "user" (par défaut) | "super_admin"
    # Note : on garde "staff" pour ne pas casser les données existantes mais
    # le seul rôle privilégié est super_admin.
    role = Column(String, default="user")

    # Taux de commission en pourcentage (ex: 2.5 = 2.5% par transaction réussie).
    # Fixé par un super_admin pour chaque utilisateur indépendamment.
    commission_rate = Column(Float, default=0.0, nullable=False)
