import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database import engine, Base
import models.user  # noqa: F401  (register models for create_all)
import models.moncash  # noqa: F401
import models.api_key  # noqa: F401
from routers import (
    user_router,
    auth_router,
    moncash_router,
    api_key_router,
    transactions_router,
    admin_router,
)
from core.config import settings
from core.exceptions import BaseAPIException, api_exception_handler


# Crée les tables si absentes (idempotent — utile pour démarrage initial).
# En prod long-terme, remplacer par Alembic.
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# CORS — la liste des origines autorisées vient de la config (env CORS_ORIGINS,
# séparée par des virgules). En prod typique l'app est servie depuis la même
# origine que l'API via le proxy nginx → CORS n'est pas déclenché. Mais on
# garde les origines explicites pour les tests cross-origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(BaseAPIException, api_exception_handler)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"🔥 Global Exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "error": str(exc)},
    )


app.include_router(user_router.router)
app.include_router(auth_router.router)
app.include_router(api_key_router.router)
app.include_router(transactions_router.router)
app.include_router(admin_router.router)
app.include_router(moncash_router.router)


@app.get("/")
def read_root():
    return {"message": "SPI — Système de Paiement Intégré"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
