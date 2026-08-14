/*
  ROUTES DES RÉCURRENCES

  Ce fichier associe les URL des récurrences
  aux fonctions de recurrence.controller.js.

  Préfixe défini dans app.js : /api/recurrences

  Routes complètes :
  - GET    /api/recurrences
  - GET    /api/recurrences/:id
  - POST   /api/recurrences
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
} from "../controllers/recurrence.controller.js"

const router = Router()

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