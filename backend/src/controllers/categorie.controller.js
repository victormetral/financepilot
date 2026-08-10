/*
  CONTRÔLEUR DES CATÉGORIES

  Ce fichier orchestre les requêtes HTTP liées
  aux catégories.

  Routes concernées :
  - GET    /api/categories
  - GET    /api/categories/:id
  - POST   /api/categories
  - PUT    /api/categories/:id
  - DELETE /api/categories/:id

  Depuis Lot 3 :
  - plus de try/catch générique ; asyncHandler transmet
    toute erreur non gérée à erreurGlobale.middleware.js ;
  - les erreurs métier (400, 404, 409) sont levées
    explicitement via ErreurHTTP.

  Répartition des responsabilités :

  categorie.controller.js
  → orchestre les requêtes HTTP
  → récupère l'identité depuis le JWT
  → traduit les cas métier en ErreurHTTP

  categorie.validator.js
  → valide et nettoie les données

  categorie.service.js
  → exécute les requêtes SQL

  Règle de sécurité :
  utilisateur_id vient toujours du JWT,
  jamais du JSON envoyé par le client.
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

/*
  Récupère uniquement les catégories
  de l'utilisateur authentifié.
*/
export const getCategories = asyncHandler(
  async (request, response) => {
    const utilisateurId = request.utilisateur.utilisateurId
    const categories = await findAllCategories(utilisateurId)
    response.json(categories)
  }
)

/*
  Récupère une catégorie uniquement si elle appartient
  à l'utilisateur authentifié.
*/
export const getCategorieById = asyncHandler(
  async (request, response) => {
    const validation = validerIdCategorie(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const utilisateurId = request.utilisateur.utilisateurId
    const categorie = await findCategorieById(
      validation.donnees.id,
      utilisateurId
    )

    if (!categorie) {
      throw new ErreurHTTP(404, "Catégorie introuvable")
    }

    response.json(categorie)
  }
)

/*
  Crée une catégorie pour l'utilisateur authentifié.

  Même si le client envoie utilisateur_id dans le JSON,
  cette valeur est ignorée : elle vient du JWT.

  Le try/catch local reste nécessaire ici, car deux codes
  PostgreSQL différents (23505, 23503) doivent donner
  deux messages métier distincts.
*/
export const postCategorie = asyncHandler(
  async (request, response) => {
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
        throw new ErreurHTTP(
          409,
          "Cette catégorie existe déjà pour cet utilisateur"
        )
      }

      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(409, "L'utilisateur authentifié n'existe pas")
      }

      throw error
    }
  }
)

/*
  Modifie entièrement une catégorie, uniquement si elle
  appartient à l'utilisateur authentifié.

  PUT exige : nom, type_categorie.
*/
export const putCategorie = asyncHandler(
  async (request, response) => {
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
      if (error instanceof ErreurHTTP) {
        throw error
      }

      if (estErreurDoublon(error)) {
        throw new ErreurHTTP(
          409,
          "Cette catégorie existe déjà pour cet utilisateur"
        )
      }

      throw error
    }
  }
)

/*
  Supprime une catégorie uniquement si elle appartient
  à l'utilisateur authentifié.
*/
export const deleteCategorieById = asyncHandler(
  async (request, response) => {
    const validation = validerIdCategorie(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const utilisateurId = request.utilisateur.utilisateurId

    try {
      const categorieSupprimee = await deleteCategorie(
        validation.donnees.id,
        utilisateurId
      )

      if (!categorieSupprimee) {
        throw new ErreurHTTP(404, "Catégorie introuvable")
      }

      response.json({
        message: "Catégorie supprimée avec succès",
        categorie: categorieSupprimee,
      })
    } catch (error) {
      if (error instanceof ErreurHTTP) {
        throw error
      }

      // PostgreSQL 23503 : catégorie encore utilisée
      // par une transaction ou un budget.
      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(
          409,
          "Impossible de supprimer cette catégorie car elle est encore utilisée dans des transactions ou des budgets"
        )
      }

      throw error
    }
  }
)