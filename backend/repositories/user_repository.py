from typing import List, Optional
from sqlalchemy.orm import Session
from models.user import User
from dtos.user import UserCreate


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def create_user(self, user: UserCreate, hashed_password: str) -> User:
        db_user = User(
            username=user.username,
            email=user.email,
            phone=user.phone,
            hashed_password=hashed_password,
            role="user",  # rôle par défaut (non settable par le client)
            commission_rate=0.0,
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def list_all(self) -> List[User]:
        return self.db.query(User).order_by(User.id.asc()).all()

    def update_commission_rate(self, user: User, rate: float) -> User:
        user.commission_rate = rate
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_role(self, user: User, role: str) -> User:
        user.role = role
        self.db.commit()
        self.db.refresh(user)
        return user
