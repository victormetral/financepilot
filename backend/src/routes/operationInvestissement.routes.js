import express from "express"

import {
  getOperationsInvestissement,
  getOperationInvestissementById,
  postOperationInvestissement,
  putOperationInvestissement,
  deleteOperationInvestissementById,
} from "../controllers/operationInvestissement.controller.js"

const router = express.Router()

// Récupérer toutes les opérations
router.get("/", getOperationsInvestissement)

// Récupérer une opération
router.get("/:id", getOperationInvestissementById)

// Créer une opération
router.post("/", postOperationInvestissement)

// Modifier une opération
router.put("/:id", putOperationInvestissement)

// Supprimer une opération
router.delete(
  "/:id",
  deleteOperationInvestissementById
)

export default router