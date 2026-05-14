# syntax=docker/dockerfile:1.7
# ----------------------------------------------------------------
# SPI — Frontend Vite (React SPA)
#
# Stratégie en 2 étapes :
#   1. builder  : Node 22 + Vite build → /app/dist
#   2. runtime  : nginx alpine qui sert dist/ + proxy /api/* → backend
#
# Build args :
#   VITE_API_URL = chemin (relatif) que le navigateur appelle.
#                  En prod : "/api" (same-origin, traversé par nginx).
#                  En dev  : "http://localhost:8000".
# ----------------------------------------------------------------

# ---- Stage 1 : build ----
FROM node:22-alpine AS builder
WORKDIR /app

# Installer les deps en cache layer séparé du code source
COPY package.json package-lock.json* bun.lock* ./
# --legacy-peer-deps : nécessaire à cause de lovable-tagger + vite@8
RUN npm ci --legacy-peer-deps --no-audit --no-fund

COPY . .

# URL de l'API embarquée dans le bundle Vite (variables VITE_* sont
# injectées à l'étape de build, pas à l'exécution).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


# ---- Stage 2 : runtime ----
FROM nginx:1.27-alpine

# Notre conf remplace celle par défaut de nginx
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Le résultat du build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
