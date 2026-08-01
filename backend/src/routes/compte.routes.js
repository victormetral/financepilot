/*
  ROUTES DES COMPTES

  Ce fichier associe les URL des comptes
  aux fonctions de compte.controller.js.

  Préfixe défini dans app.js :
  /api/comptes

  Routes complètes :
  - GET    /api/comptes
  - GET    /api/comptes/:id
  - POST   /api/comptes
  - PUT    /api/comptes/:id
  - DELETE /api/comptes/:id

  Ce fichier ne doit contenir :
  - aucune validation ;
  - aucune requête SQL ;
  - aucune règle métier.
*/

import { Router } from "express"

import {
  getComptes,
  getCompteById,
  postCompte,
  putCompte,
  deleteCompteById,
} from "../controllers/compte.controller.js"

const router = Router()

// Récupérer tous les comptes.
router.get("/", getComptes)

// Récupérer un compte par identifiant.
router.get("/:id", getCompteById)

// Créer un compte.
router.post("/", postCompte)

// Modifier entièrement un compte.
router.put("/:id", putCompte)

// 🟨 CORRIGÉ : ancien nom removeCompte.
router.delete("/:id", deleteCompteById)

export default router