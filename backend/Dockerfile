# ==========================================================
#  Dockerfile du back : construit l'API, puis la lance
# ==========================================================

# Étape A : installer les dépendances, puis compiler
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Étape B : une image neuve, avec seulement ce qui sert à lancer l'API
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production

# Correctifs de sécurité d'Alpine
RUN apk upgrade --no-cache

# Dépendances de production, puis suppression de npm (inutile pour lancer l'API)(Failles HIGH Trivy)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force \
    && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

# Le code compilé de l'étape A
COPY --from=build /app/dist ./dist

# Lancer l'API sans être administrateur
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]