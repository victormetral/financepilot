import express from "express"
import cors from "cors"
import "dotenv/config"

import { pool } from "./config/database.js"

import compteRoutes from "./routes/compte.routes.js"

const app = express()

app.use(cors())
app.use(express.json())
app.use("/api/comptes", compteRoutes) 

app.get("/", (request, response) => {
  response.json({
    message: "API FinancePilot opérationnelle",
  })
})

app.get("/api/test-database", async (request, response) => {
  try {
    const result = await pool.query("SELECT NOW()")

    response.json({
      message: "Connexion PostgreSQL réussie",
      date: result.rows[0].now,
    })
  } catch (error) {
    response.status(500).json({
      message: "Erreur de connexion PostgreSQL",
      error: error.message,
    })
  }
})

const port = Number(process.env.PORT) || 3000

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`)
})