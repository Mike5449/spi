# SPI — Système de Paiement Intégré

Passerelle de paiement intégrée pour accepter MonCash en Haïti via une simple
clé API. Backend FastAPI + Frontend React/Vite + Postgres.

## Stack

| Couche | Techno |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind, shadcn/ui |
| Backend  | FastAPI, SQLAlchemy 2, Pydantic v2, JWT, Fernet (chiffrement credentials) |
| Base     | PostgreSQL 15 |
| Proxy    | nginx (serve SPA + reverse-proxy /api/* vers backend) |
| Conteneurs | Docker + docker compose |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       INTERNET                                │
└──────────────────────┬───────────────────────────────────────┘
                       │ :80 (puis :443 avec certbot)
              ┌────────▼─────────┐
              │  spi-web         │   nginx + SPA Vite (statique)
              │  /assets/* …     │   proxy /api/* → backend:8000
              └────────┬─────────┘
                       │ docker network
              ┌────────▼─────────┐
              │  spi-backend     │   FastAPI / uvicorn
              │  :8000 (interne) │   JWT + Fernet
              └────────┬─────────┘
                       │
              ┌────────▼─────────┐
              │  spi-db          │   Postgres 15 (volume persistant)
              │  127.0.0.1:5433  │   bound loopback uniquement
              └──────────────────┘
```

## Démarrage local (Linux / macOS / WSL)

Prérequis : Docker + docker compose.

```bash
git clone https://github.com/<user>/spi-deploy.git
cd spi-deploy
cp .env.example .env

# 1) Générer les secrets
python3 -c "import secrets;print('SECRET_KEY=' + secrets.token_hex(32))"
python3 -c "from cryptography.fernet import Fernet;print('FERNET_KEY=' + Fernet.generate_key().decode())"
# Coller ces valeurs dans .env (et un POSTGRES_PASSWORD fort)

# 2) Build + démarrer
docker compose up -d --build
docker compose ps

# 3) Promouvoir le premier super-admin
# (l'utilisateur doit d'abord s'inscrire via le frontend, puis on le promeut)
docker compose exec backend python -m scripts.promote_admin <username>
```

L'app est accessible sur `http://<ip-du-serveur>/` (port 80) ou
`http://localhost/`.

## Déploiement sur un VPS (Hostinger ou autre)

### Pré-requis sur le VPS

Ubuntu 22.04+ (ou équivalent) avec accès root.

```bash
ssh root@<ip-du-serveur>

# Docker + compose
apt update
apt install -y docker.io docker-compose-plugin git ufw

# Firewall (autoriser ssh + http + https)
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Cloner et démarrer

```bash
cd /opt
git clone https://github.com/<user>/spi-deploy.git
cd spi-deploy

# Configurer les secrets
cp .env.example .env
nano .env
# - POSTGRES_PASSWORD : mot de passe fort
# - SECRET_KEY        : python -c "import secrets;print(secrets.token_hex(32))"
# - FERNET_KEY        : python -c "from cryptography.fernet import Fernet;print(Fernet.generate_key().decode())"
# - CORS_ORIGINS      : https://ton-domaine.com (ou IP en attendant DNS)
# - WEB_PORT          : 80 (défaut)

# Lancer
docker compose up -d --build

# Vérifier
docker compose ps                            # tous Up + healthy
curl -I http://127.0.0.1/                    # 200 OK
curl http://127.0.0.1/api/health             # {"status":"ok"}
```

### Brancher le DNS et TLS (quand le domaine est prêt)

```bash
# Installer certbot (mode standalone — tu peux ajouter --nginx si tu installes nginx hôte)
snap install --classic certbot
ln -s /snap/bin/certbot /usr/bin/certbot

# Arrêter temporairement le port 80
docker compose stop web

# Obtenir le certificat
certbot certonly --standalone -d spi.exemple.com -d www.spi.exemple.com

# (Option recommandée) installer nginx hôte qui termine TLS et forward vers
# le conteneur web sur 127.0.0.1:8080 — passer alors WEB_PORT=8080 dans .env
# et ajouter une vhost dans /etc/nginx/sites-available/spi
```

## Mise à jour de l'app

```bash
cd /opt/spi-deploy
git pull
docker compose up -d --build
```

⚠️ `docker compose up -d` seul **ne rebuild pas** après modif de Dockerfile.
Toujours utiliser `--build` après un `git pull`.

## Backup de la base

```bash
# Dump
docker compose exec -T db pg_dump -U spi spi > "/backup/spi-$(date +%F).sql"

# Restore
cat /backup/spi-2026-05-14.sql | docker compose exec -T db psql -U spi spi
```

## Variables d'environnement (résumé)

Voir `.env.example` pour la liste complète. Les **obligatoires** :

- `POSTGRES_PASSWORD` — mot de passe Postgres
- `SECRET_KEY` — clé HMAC pour les JWT du dashboard
- `FERNET_KEY` — clé symétrique pour chiffrer les credentials MonCash

## Structure du repo

```
spi-deploy/
├── backend/              FastAPI app
│   ├── core/             config, deps, security, encryption
│   ├── dtos/             Pydantic models
│   ├── models/           SQLAlchemy ORM
│   ├── repositories/     CRUD layer
│   ├── routers/          HTTP routes
│   ├── services/         business logic
│   ├── scripts/          bootstrap (promote_admin.py)
│   ├── Dockerfile
│   ├── main.py
│   └── requirements.txt
├── frontend/             Vite + React SPA
│   ├── src/
│   ├── Dockerfile        multi-stage (Node build → nginx serve)
│   ├── nginx.conf        SPA fallback + /api proxy
│   └── package.json
├── docker-compose.yml    db + backend + web
├── .env.example
├── .gitignore
└── README.md
```

## Endpoints principaux

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/users/` | — | Inscription |
| POST | `/token` | — | Login → JWT |
| GET  | `/users/me` | JWT | Profil |
| GET/POST/DELETE | `/api-keys/*` | JWT | Gestion des clés API |
| GET  | `/transactions/` | JWT | Mes transactions |
| POST | `/transactions/{id}/refresh-status` | JWT | Vérifier statut chez MonCash |
| GET  | `/admin/users` | JWT (super_admin) | Liste tous les users |
| PATCH | `/admin/users/{id}/commission` | JWT (super_admin) | Modifier le taux |
| POST | `/moncash/create-payment` | X-API-Key | Créer un paiement |
| POST | `/moncash/retrieve-*-payment` | X-API-Key | Récupérer une transaction |
| POST | `/moncash/customer-status` | X-API-Key | Vérifier un compte MonCash |
| POST | `/moncash/transfert` | X-API-Key | Payout |
| GET  | `/moncash/prefunded-balance` | X-API-Key | Solde |

## Sécurité

- Les credentials MonCash des utilisateurs sont chiffrés Fernet (AES) en base
- Les mots de passe sont hashés bcrypt
- JWT pour le dashboard, X-API-Key pour l'intégration marchande
- DB Postgres bind uniquement sur `127.0.0.1` (jamais Internet)
- `.env` exclu de git
- CORS configuré via env
