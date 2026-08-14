/*
  CONTRÔLEUR DES RÉCURRENCES

  Routes concernées :
  - GET    /api/recurrences
  - GET    /api/recurrences/:id
  - POST   /api/recurrences
  - PUT    /api/recurrences/:id
  - DELETE /api/recurrences/:id

  Répartition des responsabilités :
  recurrence.controller.js → orchestre les requêtes HTTP
  recurrence.validator.js  → valide, nettoie, transforme
  recurrence.service.js    → exécute les requêtes SQL

  Comme depuis le Lot 3 : asyncHandler transmet toute erreur
  non gérée à erreurGlobale.middleware.js, et les erreurs
  métier sont levées explicitement via ErreurHTTP.

  Règle de sécurité : utilisateurId vient toujours du JWT.
*/

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"
import { estErreurCleEtrangere } from "../utils/postgres.utils.js"

import {
  findAllRecurrences,
  findRecurrenceById,
  createRecurrence,
  updateRecurrence,
  deleteRecurrence,
} from "../services/recurrence.service.js"

import {
  validerIdRecurrence,
  validerDonneesRecurrence,
} from "../validators/recurrence.validator.js"

// ============================================================
// 1. LECTURE
// ============================================================

/*
  Pas de pagination ici, contrairement aux transactions :
  une récurrence par charge fixe, on en compte une dizaine
  au maximum par utilisateur.
*/
export const getRecurrences = asyncHandler(async (request, response) => {
  const recurrences = await findAllRecurrences(
    request.utilisateur.utilisateurId
  )

  response.json(recurrences)
})

export const getRecurrenceById = asyncHandler(async (request, response) => {
  const validation = validerIdRecurrence(request.params.id)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const recurrence = await findRecurrenceById(
    validation.donnees.id,
    request.utilisateur.utilisateurId
  )

  if (!recurrence) {
    throw new ErreurHTTP(404, "Récurrence introuvable")
  }

  response.json(recurrence)
})

// ============================================================
// 2. CRÉATION
// ============================================================

/*
  Try/catch local conservé : le service vérifie la propriété
  avant d'insérer, mais une suppression concurrente du compte
  entre la vérification et l'insertion produirait encore un
  23503. Le cas est rare, la réponse doit rester lisible.
*/
export const postRecurrence = asyncHandler(async (request, response) => {
  const validation = validerDonneesRecurrence(request.body)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  try {
    const nouvelleRecurrence = await createRecurrence(
      request.utilisateur.utilisateurId,
      validation.donnees
    )

    // Aucune ligne insérée : compte ou catégorie hors périmètre.
    if (!nouvelleRecurrence) {
      throw new ErreurHTTP(404, "Compte ou catégorie introuvable")
    }

    response.status(201).json(nouvelleRecurrence)
  } catch (error) {
    if (error instanceof ErreurHTTP) throw error

    if (estErreurCleEtrangere(error)) {
      throw new ErreurHTTP(
        409,
        "Le compte ou la catégorie indiqué n'existe pas"
      )
    }

    throw error
  }
})

// ============================================================
// 3. MODIFICATION
// ============================================================

export const putRecurrence = asyncHandler(async (request, response) => {
  const validationId = validerIdRecurrence(request.params.id)

  if (!validationId.estValide) {
    throw new ErreurHTTP(400, validationId.message)
  }

  const validationDonnees = validerDonneesRecurrence(request.body)

  if (!validationDonnees.estValide) {
    throw new ErreurHTTP(400, validationDonnees.message)
  }

  try {
    const recurrenceModifiee = await updateRecurrence(
      validationId.donnees.id,
      request.utilisateur.utilisateurId,
      validationDonnees.donnees
    )

    if (!recurrenceModifiee) {
      throw new ErreurHTTP(
        404,
        "Récurrence, compte ou catégorie introuvable"
      )
    }

    response.json(recurrenceModifiee)
  } catch (error) {
    if (error instanceof ErreurHTTP) throw error

    if (estErreurCleEtrangere(error)) {
      throw new ErreurHTTP(
        409,
        "Le compte ou la catégorie indiqué n'existe pas"
      )
    }

    throw error
  }
})

// ============================================================
// 4. SUPPRESSION
// ============================================================

export const deleteRecurrenceById = asyncHandler(async (request, response) => {
  const validation = validerIdRecurrence(request.params.id)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const recurrenceSupprimee = await deleteRecurrence(
    validation.donnees.id,
    request.utilisateur.utilisateurId
  )

  if (!recurrenceSupprimee) {
    throw new ErreurHTTP(404, "Récurrence introuvable")
  }

  // Les transactions déjà générées ne sont pas supprimées :
  // la clé étrangère est ON DELETE SET NULL.
  response.json({
    message: "Récurrence supprimée",
    recurrence: recurrenceSupprimee,
  })
})