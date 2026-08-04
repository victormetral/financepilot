/*
  ROUTES DES UTILISATEURS

  POST / est public :
  il permet de créer un compte.

  Les autres routes nécessitent un JWT.
*/

import express from "express"

import {
  getUtilisateurs,
  getUtilisateurById,
  postUtilisateur,
  putUtilisateur,
  deleteUtilisateurById,
} from "../controllers/utilisateur.controller.js"

// 🟨 NOUVEAU
import {
  verifierAuthentification,
} from "../middlewares/auth.middleware.js"

const router = express.Router()

// Route publique : créer un compte.
router.post("/", postUtilisateur)

// 🟨 NOUVEAU
// Toutes les routes placées après cette ligne sont protégées.
router.use(verifierAuthentification)

// Récupérer tous les utilisateurs.
router.get("/", getUtilisateurs)

// Récupérer un utilisateur.
router.get("/:id", getUtilisateurById)

// Modifier un utilisateur.
router.put("/:id", putUtilisateur)

// Supprimer un utilisateur.
router.delete("/:id", deleteUtilisateurById)

export default router