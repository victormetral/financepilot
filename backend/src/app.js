/*
  POINT D’ENTRÉE DE L’API FINANCEPILOT

  Ce fichier :
  - crée l’application Express ;
  - active les middlewares généraux ;
  - monte les différents fichiers de routes ;
  - démarre le serveur HTTP.

  Répartition des responsabilités :

  app.js
  → configure l’application

  routes/
  → associe les URL aux contrôleurs

  controllers/
  → orchestre les requêtes HTTP

  validators/
  → valide et transforme les données

  services/
  → exécute les requêtes SQL

  Victor :
  ce fichier ne doit pas contenir directement
  les règles métier ou les requêtes PostgreSQL.
*/

import express from "express"
import cors from "cors"
import dotenv from "dotenv"

// 🟨 NOUVEAU
// Importe les routes de connexion.
import authRoutes from "./routes/auth.routes.js"

import utilisateurRoutes from "./routes/utilisateur.routes.js"
import compteRoutes from "./routes/compte.routes.js"
import categorieRoutes from "./routes/categorie.routes.js"
import transactionRoutes from "./routes/transaction.routes.js"
import budgetRoutes from "./routes/budget.routes.js"
import objectifRoutes from "./routes/objectif.routes.js"
import actifFinancierRoutes from "./routes/actifFinancier.routes.js"
import operationInvestissementRoutes from "./routes/operationInvestissement.routes.js"

/*
  Charge les variables présentes dans le fichier .env.

  Exemples :
  PORT=3000
  JWT_SECRET=cle_secrete
*/
dotenv.config()

const app = express()

/*
  CORS signifie :
  Cross-Origin Resource Sharing
  → partage de ressources entre origines différentes.

  Cela permettra au frontend d’appeler le backend
  même s’ils utilisent des ports différents.
*/
app.use(cors())

/*
  Permet à Express de lire les corps de requêtes JSON.

  Exemple :
  request.body.email
*/
app.use(express.json())

/*
  Route simple permettant de vérifier rapidement
  que l’API fonctionne.

  GET /
*/
app.get("/", (request, response) => {
  response.json({
    message: "API FinancePilot opérationnelle",
  })
})

/*
  Routes d’authentification.

  Préfixe :
  /api/auth

  Chemin défini dans auth.routes.js :
  /connexion

  Route complète :
  POST /api/auth/connexion
*/
// 🟨 NOUVEAU
app.use(
  "/api/auth",
  authRoutes
)

/*
  Routes des utilisateurs.

  Préfixe complet :
  /api/utilisateurs
*/
app.use(
  "/api/utilisateurs",
  utilisateurRoutes
)

/*
  Routes des comptes.

  Préfixe complet :
  /api/comptes
*/
app.use(
  "/api/comptes",
  compteRoutes
)

/*
  Routes des catégories.

  Préfixe complet :
  /api/categories
*/
app.use(
  "/api/categories",
  categorieRoutes
)

/*
  Routes des transactions financières.

  Préfixe complet :
  /api/transactions
*/
app.use(
  "/api/transactions",
  transactionRoutes
)

/*
  Routes des budgets.

  Préfixe complet :
  /api/budgets
*/
app.use(
  "/api/budgets",
  budgetRoutes
)

/*
  Routes des objectifs financiers.

  Préfixe complet :
  /api/objectifs
*/
app.use(
  "/api/objectifs",
  objectifRoutes
)

/*
  Routes des actifs financiers.

  Préfixe complet :
  /api/actifs-financiers
*/
app.use(
  "/api/actifs-financiers",
  actifFinancierRoutes
)

/*
  Routes des opérations d’investissement.

  Préfixe complet :
  /api/operations-investissement
*/
app.use(
  "/api/operations-investissement",
  operationInvestissementRoutes
)

/*
  Utilise le port du fichier .env.

  Si PORT n’existe pas,
  le serveur utilise le port 3000.
*/
const PORT = process.env.PORT || 3000

/*
  Démarre le serveur Express.
*/
app.listen(PORT, () => {
  console.log(
    `Serveur démarré sur http://localhost:${PORT}`
  )
})