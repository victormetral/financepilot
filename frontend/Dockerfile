# ==========================================================
#  Dockerfile du front : compile Angular, puis le sert avec nginx
# ==========================================================

# Étape A : installer les dépendances, puis compiler
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape B : nginx sans root sert les fichiers compilés
FROM nginx/nginx-unprivileged:1.30-alpine

# Correctifs de sécurité d'Alpine (root le temps de la mise à jour, puis retour à l'utilisateur 101)
USER root
RUN apk upgrade --no-cache
USER 101

# Notre configuration nginx, puis les fichiers compilés de l'étape A
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 8080
