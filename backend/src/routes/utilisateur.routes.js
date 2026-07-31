import express from "express"

import {
  getUtilisateurs,
  getUtilisateurById,
  postUtilisateur,
  putUtilisateur,
  deleteUtilisateurById,
} from "../controllers/utilisateur.controller.js"

const router = express.Router()

// Récupérer tous les utilisateurs
router.get("/", getUtilisateurs)

// Récupérer un utilisateur par son identifiant
router.get("/:id", getUtilisateurById)

// Créer un utilisateur
router.post("/", postUtilisateur)

// Modifier un utilisateur
router.put("/:id", putUtilisateur)

// Supprimer un utilisateur
router.delete("/:id", deleteUtilisateurById)

export default router