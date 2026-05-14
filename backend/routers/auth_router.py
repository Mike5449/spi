from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from database import get_db
from repositories.user_repository import UserRepository
from services.auth_service import AuthService
from dtos.token import Token

router = APIRouter(tags=["auth"])

def get_auth_service(db: Session = Depends(get_db)):
    repo = UserRepository(db)
    return AuthService(repo)

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), service: AuthService = Depends(get_auth_service)):
    return service.login_access_token(form_data)
