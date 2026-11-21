# ==========================================================
#  Dockerfile : la recette de l'image du front
#  Compile l'appli Angular, puis la sert avec nginx
#  Choix pro : deux étapes → l'image finale ne contient pas Node
# ==========================================================

# Étape A : compiler l'appli
# Choix pro : même version de Node que le back, image Alpine légère
FROM node:26-alpine AS build
WORKDIR /app

# Les dépendances d'abord (Docker garde ce résultat en cache)
COPY package.json package-lock.json ./
RUN npm ci

# Puis le code, et la compilation (ng build, configuration production)
COPY . .
RUN npm run build

# Étape B : servir les fichiers compilés
# Choix pro : nginx sans root (même logique que USER node dans le back)
FROM nginx/nginx-unprivileged:1.30-alpine

# Notre configuration remplace celle livrée avec l'image
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Seuls les fichiers compilés passent de l'étape A à l'étape B
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Le port écouté par nginx (celui de ton nginx.conf)
EXPOSE 8080
