from sqlalchemy import func
from sqlalchemy.orm import Session
from models.moncash import MonCashTransaction
from typing import Optional, List, Tuple


class MonCashRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_transaction(self, obj_in: dict) -> MonCashTransaction:
        db_obj = MonCashTransaction(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def get_by_order_id(self, order_id: str) -> Optional[MonCashTransaction]:
        return (
            self.db.query(MonCashTransaction)
            .filter(MonCashTransaction.order_id == order_id)
            .first()
        )

    def get_by_transaction_id(self, transaction_id: str) -> Optional[MonCashTransaction]:
        return (
            self.db.query(MonCashTransaction)
            .filter(MonCashTransaction.transaction_id == transaction_id)
            .first()
        )

    def update_transaction(
        self, db_obj: MonCashTransaction, obj_in: dict
    ) -> MonCashTransaction:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def list_for_user(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 200,
    ) -> List[MonCashTransaction]:
        return (
            self.db.query(MonCashTransaction)
            .filter(MonCashTransaction.user_id == user_id)
            .order_by(MonCashTransaction.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def commission_summary_for_user(self, user_id: int) -> Tuple[float, int, float]:
        """
        Retourne (total_commission_owed, successful_count, total_volume) pour les
        transactions "successful" de l'utilisateur.
        """
        row = (
            self.db.query(
                func.coalesce(func.sum(MonCashTransaction.commission_amount), 0.0),
                func.count(MonCashTransaction.id),
                func.coalesce(func.sum(MonCashTransaction.amount), 0.0),
            )
            .filter(
                MonCashTransaction.user_id == user_id,
                MonCashTransaction.status == "successful",
            )
            .one()
        )
        return float(row[0] or 0.0), int(row[1] or 0), float(row[2] or 0.0)

    def stats_for_user(self, user_id: int) -> dict:
        """
        Compteurs détaillés pour la vue admin :
        successful / failed / pending counts + total_volume + commission_owed.
        """
        rows = (
            self.db.query(
                MonCashTransaction.status,
                func.count(MonCashTransaction.id),
                func.coalesce(func.sum(MonCashTransaction.amount), 0.0),
                func.coalesce(func.sum(MonCashTransaction.commission_amount), 0.0),
            )
            .filter(MonCashTransaction.user_id == user_id)
            .group_by(MonCashTransaction.status)
            .all()
        )
        out = {
            "successful_count": 0,
            "failed_count": 0,
            "pending_count": 0,
            "total_volume_successful": 0.0,
            "total_commission_owed": 0.0,
        }
        for status_, count, sum_amount, sum_commission in rows:
            if status_ == "successful":
                out["successful_count"] = int(count or 0)
                out["total_volume_successful"] = float(sum_amount or 0.0)
                out["total_commission_owed"] = float(sum_commission or 0.0)
            elif status_ == "failed":
                out["failed_count"] = int(count or 0)
            else:
                # "created", "pending", etc.
                out["pending_count"] += int(count or 0)
        return out
