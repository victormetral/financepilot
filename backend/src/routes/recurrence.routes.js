/*
  ROUTES DES RÉCURRENCES

  Ce fichier associe les URL des récurrences
  aux fonctions de recurrence.controller.js.

  Préfixe défini dans app.js : /api/recurrences

  Routes complètes :
  - GET    /api/recurrences
  - GET    /api/recurrences/:id
  - POST   /api/recurrences
  - POST   /api/recurrences/generer
  - PUT    /api/recurrences/:id
  - DELETE /api/recurrences/:id

  Ce fichier ne doit contenir :
  - aucune validation ;
  - aucune requête SQL ;
  - aucune règle métier.
*/

import { Router } from "express"

import {
  getRecurrences,
  getRecurrenceById,
  postRecurrence,
  putRecurrence,
  deleteRecurrenceById,
  postGenerationRecurrences,
} from "../controllers/recurrence.controller.js"

const router = Router()

// ============================================================
// 1. ROUTES À CHEMIN FIXE
// ============================================================

/*
  "generer" doit être déclaré avant toute route contenant
  ":id" sur le même verbe. Express parcourt les routes dans
  l'ordre d'écriture : une route à joker placée avant
  intercepterait "generer" en le prenant pour un identifiant.

  Le POST n'a pas de route ":id" ici, mais la règle est
  conservée pour que l'ajout d'une telle route plus tard
  ne casse rien silencieusement.
*/
router.post("/generer", postGenerationRecurrences)

// ============================================================
// 2. CRUD
// ============================================================

// Lister les récurrences de l'utilisateur.
router.get("/", getRecurrences)

// Récupérer une récurrence par identifiant.
router.get("/:id", getRecurrenceById)

// Créer une récurrence.
router.post("/", postRecurrence)

// Modifier entièrement une récurrence.
router.put("/:id", putRecurrence)

// Supprimer une récurrence (les transactions générées restent).
router.delete("/:id", deleteRecurrenceById)

export default router