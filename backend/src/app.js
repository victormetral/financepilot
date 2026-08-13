/*
  POINT D'ENTRÉE DE L'API FINANCEPILOT

  Crée l'application Express, active les middlewares de
  sécurité et de session, monte les routes, démarre le serveur.
*/

import express from "express"
import cors from "cors"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

import authRoutes from "./routes/auth.routes.js"
import utilisateurRoutes from "./routes/utilisateur.routes.js"
import { verifierAuthentification } from "./middlewares/auth.middleware.js"

import compteRoutes from "./routes/compte.routes.js"
import categorieRoutes from "./routes/categorie.routes.js"
import transactionRoutes from "./routes/transaction.routes.js"
import budgetRoutes from "./routes/budget.routes.js"
import objectifRoutes from "./routes/objectif.routes.js"
import actifFinancierRoutes from "./routes/actifFinancier.routes.js"
import operationInvestissementRoutes from "./routes/operationInvestissement.routes.js"
import { erreurGlobale } from "./middlewares/erreurGlobale.middleware.js"

dotenv.config()

const app = express()

// En-têtes de sécurité HTTP (Lot 1).
app.use(helmet())

// CORS restreint au frontend connu, credentials nécessaires
// pour que le cookie httpOnly parte avec chaque requête (Lot 5).
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())

// Limite les tentatives sur les routes sensibles (Lot 1).
const limiteurAuthentification = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

app.get("/", (request, response) => {
  response.json({ message: "API FinancePilot opérationnelle" })
})

app.use("/api/auth", limiteurAuthentification, authRoutes)
app.use("/api/utilisateurs", limiteurAuthentification, utilisateurRoutes)

app.use(verifierAuthentification)

app.use("/api/comptes", compteRoutes)
app.use("/api/categories", categorieRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/budgets", budgetRoutes)
app.use("/api/objectifs", objectifRoutes)
app.use("/api/actifs-financiers", actifFinancierRoutes)
app.use("/api/operations-investissement", operationInvestissementRoutes)

// Doit rester après toutes les routes, juste avant app.listen.
app.use(erreurGlobale)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`)
})