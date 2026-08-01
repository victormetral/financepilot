/*
  ROUTES DES CATÉGORIES

  Ce fichier associe les URL des catégories
  aux fonctions de categorie.controller.js.

  Préfixe défini dans app.js :
  /api/categories

  Routes complètes :
  - GET    /api/categories
  - GET    /api/categories/:id
  - POST   /api/categories
  - PUT    /api/categories/:id
  - DELETE /api/categories/:id

  Ce fichier ne doit contenir :
  - aucune validation ;
  - aucune requête SQL ;
  - aucune règle métier.
*/

import { Router } from "express"

import {
  getCategories,
  getCategorieById,
  postCategorie,
  putCategorie,
  deleteCategorieById,
} from "../controllers/categorie.controller.js"

const router = Router()

// Récupérer toutes les catégories.
router.get("/", getCategories)

// Récupérer une catégorie par identifiant.
router.get("/:id", getCategorieById)

// Créer une catégorie.
router.post("/", postCategorie)

// Modifier entièrement une catégorie.
router.put("/:id", putCategorie)

// 🟨 CORRIGÉ : ancien nom removeCategorie.
router.delete("/:id", deleteCategorieById)

export default router