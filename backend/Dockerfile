# ==========================================================
#  Dockerfile : la recette de l'image du back
#  Construit l'API NestJS, puis la lance dans une image légère
#  Choix pro : deux étapes → l'image finale ne garde que le nécessaire
# ==========================================================

# Étape A : construire l'appli
# Choix pro : version de Node fixée (26, LTS), image Alpine légère
FROM node:26-alpine AS build
WORKDIR /app

# Les dépendances d'abord (Docker garde ce résultat en cache)
# Choix pro : npm ci → exactement les versions du package-lock
COPY package.json package-lock.json ./
RUN npm ci

# Le reste du code, puis le client Prisma et la compilation
COPY . .
RUN npx prisma generate
RUN npm run build

# Étape B : exécuter l'appli, dans une image neuve
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production

# Seulement les paquets utiles en production
# Choix pro : aucun outil de construction dans l'image finale
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Le code compilé, récupéré de l'étape A
COPY --from=build /app/dist ./dist

# Choix pro : ne pas tourner en administrateur (sécurité)
USER node

# Le port de l'API, puis la commande de lancement
EXPOSE 3000
CMD ["node", "dist/main.js"]