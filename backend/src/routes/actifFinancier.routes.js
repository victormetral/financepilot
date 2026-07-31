import express from "express"

import {
  getActifsFinanciers,
  getActifFinancierById,
  postActifFinancier,
  putActifFinancier,
  deleteActifFinancierById,
} from "../controllers/actifFinancier.controller.js"

const router = express.Router()

// Récupérer tous les actifs financiers
router.get("/", getActifsFinanciers)

// Récupérer un actif financier
router.get("/:id", getActifFinancierById)

// Créer un actif financier
router.post("/", postActifFinancier)

// Modifier un actif financier
router.put("/:id", putActifFinancier)

// Supprimer un actif financier
router.delete(
  "/:id",
  deleteActifFinancierById
)

export default router