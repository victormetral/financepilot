/*
  POINT D'ENTRÉE DE L'API FINANCEPILOT
  ...
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

// 🟨 NOUVEAU Lot 3 — AJOUT 1 : l'import
import { erreurGlobale } from "./middlewares/erreurGlobale.middleware.js"

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (request, response) => {
  response.json({ message: "API FinancePilot opérationnelle" })
})

app.use("/api/auth", authRoutes)
app.use("/api/utilisateurs", utilisateurRoutes)

app.use(verifierAuthentification)

app.use("/api/comptes", compteRoutes)
app.use("/api/categories", categorieRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/budgets", budgetRoutes)
app.use("/api/objectifs", objectifRoutes)
app.use("/api/actifs-financiers", actifFinancierRoutes)
app.use("/api/operations-investissement", operationInvestissementRoutes)

// 🟨 NOUVEAU Lot 3 — AJOUT 2 : le middleware d'erreur
// DOIT être placé ici : après toutes les routes,
// juste avant app.listen.
app.use(erreurGlobale)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})