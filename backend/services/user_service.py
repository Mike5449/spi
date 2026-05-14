from dtos.user import UserCreate
from repositories.user_repository import UserRepository
from core.exceptions import UserAlreadyExistsException
from core.security import get_password_hash


class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def create_new_user(self, user: UserCreate):
        if self.user_repository.get_user_by_email(email=user.email):
            raise UserAlreadyExistsException(detail="Email already registered")
        if self.user_repository.get_user_by_username(username=user.username):
            raise UserAlreadyExistsException(detail="Username already taken")

        hashed_password = get_password_hash(user.password)
        return self.user_repository.create_user(user=user, hashed_password=hashed_password)
