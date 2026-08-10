/*
  CONTRÔLEUR DES CATÉGORIES

  categorie.controller.js → orchestre les requêtes HTTP
  categorie.validator.js  → valide et nettoie
  categorie.service.js    → exécute les requêtes SQL

  Règle de sécurité : utilisateur_id vient toujours du JWT.
*/

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"

import {
  estErreurCleEtrangere,
  estErreurDoublon,
} from "../utils/postgres.utils.js"

import {
  findAllCategories,
  findCategorieById,
  createCategorie,
  updateCategorie,
  deleteCategorie,
} from "../services/categorie.service.js"

import {
  validerIdCategorie,
  validerCreationCategorie,
  validerModificationCategorie,
} from "../validators/categorie.validator.js"

export const getCategories = asyncHandler(async (request, response) => {
  const utilisateurId = request.utilisateur.utilisateurId
  const categories = await findAllCategories(utilisateurId)
  response.json(categories)
})

export const getCategorieById = asyncHandler(async (request, response) => {
  const validation = validerIdCategorie(request.params.id)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const utilisateurId = request.utilisateur.utilisateurId
  const categorie = await findCategorieById(validation.donnees.id, utilisateurId)

  if (!categorie) {
    throw new ErreurHTTP(404, "Catégorie introuvable")
  }

  response.json(categorie)
})

// Try/catch conservé : deux erreurs pg possibles (23505 doublon, 23503 utilisateur inexistant).
export const postCategorie = asyncHandler(async (request, response) => {
  const validation = validerCreationCategorie(request.body)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const donneesCategorie = {
    ...validation.donnees,
    utilisateur_id: request.utilisateur.utilisateurId,
  }

  try {
    const nouvelleCategorie = await createCategorie(donneesCategorie)
    response.status(201).json(nouvelleCategorie)
  } catch (error) {
    if (estErreurDoublon(error)) {
      throw new ErreurHTTP(409, "Cette catégorie existe déjà pour cet utilisateur")
    }
    if (estErreurCleEtrangere(error)) {
      throw new ErreurHTTP(409, "L'utilisateur authentifié n'existe pas")
    }
    throw error
  }
})

export const putCategorie = asyncHandler(async (request, response) => {
  const validationId = validerIdCategorie(request.params.id)

  if (!validationId.estValide) {
    throw new ErreurHTTP(400, validationId.message)
  }

  const validationDonnees = validerModificationCategorie(request.body)

  if (!validationDonnees.estValide) {
    throw new ErreurHTTP(400, validationDonnees.message)
  }

  const utilisateurId = request.utilisateur.utilisateurId

  try {
    const categorieModifiee = await updateCategorie(
      validationId.donnees.id,
      utilisateurId,
      validationDonnees.donnees
    )

    if (!categorieModifiee) {
      throw new ErreurHTTP(404, "Catégorie introuvable")
    }

    response.json(categorieModifiee)
  } catch (error) {
    if (error instanceof ErreurHTTP) throw error
    if (estErreurDoublon(error)) {
      throw new ErreurHTTP(409, "Cette catégorie existe déjà pour cet utilisateur")
    }
    throw error
  }
})

export const deleteCategorieById = asyncHandler(async (request, response) => {
  const validation = validerIdCategorie(request.params.id)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const utilisateurId = request.utilisateur.utilisateurId

  try {
    const categorieSupprimee = await deleteCategorie(validation.donnees.id, utilisateurId)

    if (!categorieSupprimee) {
      throw new ErreurHTTP(404, "Catégorie introuvable")
    }

    response.json({
      message: "Catégorie supprimée avec succès",
      categorie: categorieSupprimee,
    })
  } catch (error) {
    if (error instanceof ErreurHTTP) throw error
    // 23503 : encore utilisée par une transaction ou un budget.
    if (estErreurCleEtrangere(error)) {
      throw new ErreurHTTP(
        409,
        "Impossible de supprimer cette catégorie car elle est encore utilisée dans des transactions ou des budgets"
      )
    }
    throw error
  }
})