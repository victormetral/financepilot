/*
  POINT D'ENTRÉE DE L'API FINANCEPILOT

  Rôle général :
  crée l'application Express, active les middlewares
  de sécurité et généraux, monte les routes, démarre
  le serveur.

  Utilise :
  - routes/*.routes.js (toutes les routes de l'API)
  - middlewares/auth.middleware.js (vérification JWT)

  Sécurité (🟨 NOUVEAU) :
  - helmet : ajoute les en-têtes HTTP de sécurité par défaut
  - cors : restreint les origines autorisées au frontend
  - express-rate-limit : limite les tentatives sur /api/auth
    pour freiner le brute-force de mot de passe

  🟨 CORRIGÉ :
  seuil du rate limiter relevé à 300 requêtes / 15 min.
  20 était trop bas : les scripts de test (qui créent
  et connectent beaucoup d'utilisateurs à la suite)
  déclenchaient le blocage. 300 reste largement
  suffisant pour freiner un vrai brute-force tout en
  laissant passer un usage normal (tests inclus).
*/

import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import rateLimit from "express-rate-limit"

import authRoutes from "./routes/auth.routes.js"
import utilisateurRoutes from "./routes/utilisateur.routes.js"

import {
  verifierAuthentification,
} from "./middlewares/auth.middleware.js"

import compteRoutes from "./routes/compte.routes.js"
import categorieRoutes from "./routes/categorie.routes.js"
import transactionRoutes from "./routes/transaction.routes.js"
import budgetRoutes from "./routes/budget.routes.js"
import objectifRoutes from "./routes/objectif.routes.js"
import actifFinancierRoutes from "./routes/actifFinancier.routes.js"
import operationInvestissementRoutes from "./routes/operationInvestissement.routes.js"

dotenv.config()

const app = express()

/*
  🟨 NOUVEAU

  helmet ajoute des en-têtes HTTP de sécurité
  (X-Frame-Options, X-Content-Type-Options, etc.)
  avec des réglages par défaut raisonnables.
*/
app.use(helmet())

/*
  🟨 CORRIGÉ

  CORS n'accepte plus toutes les origines.
  Seule l'URL du frontend (définie dans .env,
  avec le port par défaut de Vite en secours)
  peut appeler l'API depuis un navigateur.
*/
const ORIGINE_FRONTEND =
  process.env.FRONTEND_URL || "http://localhost:5173"

app.use(
  cors({
    origin: ORIGINE_FRONTEND,
  })
)

app.use(express.json())

/*
  🟨 CORRIGÉ

  Limite les tentatives de connexion et de création
  de compte : 300 requêtes maximum par adresse IP
  toutes les 15 minutes sur /api/auth et /api/utilisateurs.

  Objectif : freiner le brute-force de mot de passe
  sans gêner un usage normal (y compris les scripts
  de test qui enchaînent beaucoup de requêtes).
*/
const limiteurAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    message:
      "Trop de tentatives. Réessayez dans quelques minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Route publique : vérifier que l'API fonctionne.
app.get("/", (request, response) => {
  response.json({
    message: "API FinancePilot opérationnelle",
  })
})

// Route publique : connexion (protégée par le rate limiter).
app.use(
  "/api/auth",
  limiteurAuth,
  authRoutes
)

// 🟨 CORRIGÉ
// POST /api/utilisateurs reste public (création de compte),
// protégé lui aussi par le rate limiter.
// Les autres routes utilisateur sont protégées
// dans utilisateur.routes.js.
app.use(
  "/api/utilisateurs",
  limiteurAuth,
  utilisateurRoutes
)

// Vérification du JWT pour les routes suivantes.
app.use(verifierAuthentification)

// Routes CRUD protégées.
app.use(
  "/api/comptes",
  compteRoutes
)

app.use(
  "/api/categories",
  categorieRoutes
)

app.use(
  "/api/transactions",
  transactionRoutes
)

app.use(
  "/api/budgets",
  budgetRoutes
)

app.use(
  "/api/objectifs",
  objectifRoutes
)

app.use(
  "/api/actifs-financiers",
  actifFinancierRoutes
)

app.use(
  "/api/operations-investissement",
  operationInvestissementRoutes
)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(
    `Serveur démarré sur http://localhost:${PORT}`
  )
})