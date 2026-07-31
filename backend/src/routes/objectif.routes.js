import express from "express"

import {
  getObjectifs,
  getObjectifById,
  postObjectif,
  putObjectif,
  deleteObjectifById,
} from "../controllers/objectif.controller.js"

const router = express.Router()

// Récupérer tous les objectifs
router.get("/", getObjectifs)

// Récupérer un objectif
router.get("/:id", getObjectifById)

// Créer un objectif
router.post("/", postObjectif)

// Modifier un objectif
router.put("/:id", putObjectif)

// Supprimer un objectif
router.delete("/:id", deleteObjectifById)

export default router

