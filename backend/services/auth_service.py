from datetime import timedelta
from repositories.user_repository import UserRepository
from core.security import verify_password, create_access_token
from core.config import settings
from fastapi import HTTPException, status

class AuthService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository

    def authenticate_user(self, username: str, password: str):
        user = self.user_repository.get_user_by_username(username=username)
        if not user:
            return False
        if not verify_password(password, user.hashed_password):
            return False
        return user

    def login_access_token(self, form_data):
        user = self.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
