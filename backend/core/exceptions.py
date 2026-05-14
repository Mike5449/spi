from fastapi import Request, status
from fastapi.responses import JSONResponse


class BaseAPIException(Exception):
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    detail: str = "Internal Server Error"

    def __init__(self, detail: str = None):
        if detail:
            self.detail = detail


class NotFoundException(BaseAPIException):
    status_code = status.HTTP_404_NOT_FOUND


class UserAlreadyExistsException(BaseAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "User already exists"


class InvalidCredentialsException(BaseAPIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Invalid credentials"


class InvalidApiKeyException(BaseAPIException):
    status_code = status.HTTP_401_UNAUTHORIZED
    detail = "Invalid or revoked API key"


class ApiKeyNotFoundException(BaseAPIException):
    status_code = status.HTTP_404_NOT_FOUND
    detail = "API key not found"


class MissingMonCashCredentialsException(BaseAPIException):
    status_code = status.HTTP_400_BAD_REQUEST
    detail = "MonCash CLIENT_ID and CLIENT_SECRET are required for live environment"


def api_exception_handler(request: Request, exc: BaseAPIException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )
