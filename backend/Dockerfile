# syntax=docker/dockerfile:1.7
# ----------------------------------------------------------------
# SPI — Backend FastAPI / Python
#
# Build : docker compose build backend
# Run   : docker compose up -d backend
# ----------------------------------------------------------------
FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Build deps (build-essential, libpq-dev pour psycopg2) + runtime libs
# (libpq5 pour psycopg2 à l'exécution, curl pour le healthcheck).
# Tout dans une même couche puis purge des build deps.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential libpq-dev libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Drop build-time deps mais on garde libpq5 + curl
RUN apt-get purge -y --auto-remove build-essential libpq-dev \
    && apt-get clean

COPY . .

# Pour des uploads éventuels (chiffrement, fichiers de logs persistés, …)
RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

EXPOSE 8000

# Le compose attend `condition: service_healthy` avant de démarrer le web.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -fsS http://localhost:8000/health || exit 1

# `--proxy-headers` + `--forwarded-allow-ips=*` pour respecter X-Forwarded-Proto
# du proxy nginx (utile pour générer correctement les URLs absolues si besoin).
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", \
     "--proxy-headers", "--forwarded-allow-ips=*"]
