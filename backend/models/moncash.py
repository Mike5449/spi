from sqlalchemy import Column, Float, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class MonCashTransaction(Base):
    __tablename__ = "moncash_transactions"

    id = Column(Integer, primary_key=True, index=True)

    # Propriétaire de la transaction (utile pour le dashboard)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id", ondelete="SET NULL"), nullable=True, index=True)

    order_id = Column(String, unique=True, index=True)
    transaction_id = Column(String, unique=True, index=True, nullable=True)
    payment_token = Column(String, index=True, nullable=True)
    amount = Column(Float)
    currency = Column(String, default="HTG")
    # created | successful | failed | expired
    status = Column(String, default="created", index=True)
    payer_phone = Column(String, nullable=True)
    description = Column(String, nullable=True)
    # payment | payout
    transaction_type = Column(String, index=True)
    environment = Column(String, nullable=True)  # sandbox | live
    payment_url = Column(String, nullable=True)

    # Snapshot du taux de commission au moment où la transaction réussit (en %).
    # Si la tx n'a jamais atteint "successful", ces deux colonnes restent NULL.
    commission_rate = Column(Float, nullable=True)
    commission_amount = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_tx_user_created", "user_id", "created_at"),
    )
