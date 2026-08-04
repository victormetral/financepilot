/*
  POINT D’ENTRÉE DE L’API FINANCEPILOT

  Ce fichier :
  - crée l’application Express ;
  - active les middlewares généraux ;
  - monte les routes ;
  - démarre le serveur.
*/

import express from "express"
import cors from "cors"
import dotenv from "dotenv"

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

app.use(cors())
app.use(express.json())

// Route publique : vérifier que l’API fonctionne.
app.get("/", (request, response) => {
  response.json({
    message: "API FinancePilot opérationnelle",
  })
})

// Route publique : connexion.
app.use(
  "/api/auth",
  authRoutes
)

// 🟨 CORRIGÉ
// POST /api/utilisateurs reste public.
// Les autres routes utilisateur sont protégées
// dans utilisateur.routes.js.
app.use(
  "/api/utilisateurs",
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