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

  Répartition des responsabilités :

  categorie.controller.js
  → orchestre les requêtes HTTP

  categorie.validator.js
  → valide, transforme et nettoie les données

  categorie.service.js
  → exécute les requêtes SQL

  Victor :
  si une règle concernant le nom,
  le type ou les identifiants change,
  modifie d’abord categorie.validator.js.
*/

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

// 🟨 NOUVEAU : validations déplacées
// dans un fichier spécialisé.
import {
  validerIdCategorie,
  validerCreationCategorie,
  validerModificationCategorie,
} from "../validators/categorie.validator.js"

/*
  Récupère toutes les catégories.

  Exemple :
  GET /api/categories
*/
export const getCategories = async (
  request,
  response
) => {
  try {
    const categories =
      await findAllCategories()

    response.json(categories)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des catégories",
      error: error.message,
    })
  }
}

/*
  Récupère une catégorie précise grâce
  à l’identifiant placé dans l’URL.

  Exemple :
  GET /api/categories/3
*/
export const getCategorieById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdCategorie(
        request.params.id
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const categorie =
      await findCategorieById(
        validation.donnees.id
      )

    if (!categorie) {
      return response.status(404).json({
        message: "Catégorie introuvable",
      })
    }

    response.json(categorie)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de la catégorie",
      error: error.message,
    })
  }
}

/*
  Crée une nouvelle catégorie.

  Le validateur :
  - vérifie utilisateur_id ;
  - vérifie nom ;
  - vérifie type_categorie ;
  - retire les espaces inutiles.
*/
export const postCategorie = async (
  request,
  response
) => {
  try {
    const validation =
      validerCreationCategorie(
        request.body
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const nouvelleCategorie =
      await createCategorie(
        validation.donnees
      )

    response
      .status(201)
      .json(nouvelleCategorie)
  } catch (error) {
    /*
      PostgreSQL 23505 :
      une contrainte UNIQUE est violée.

      Cela signifie ici que cette catégorie
      existe déjà pour cet utilisateur.
    */
    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Cette catégorie existe déjà pour cet utilisateur",
      })
    }

    /*
      PostgreSQL 23503 :
      utilisateur_id ne correspond
      à aucun utilisateur existant.
    */
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "L’utilisateur indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de la catégorie",
      error: error.message,
    })
  }
}

/*
  Modifie entièrement une catégorie.

  PUT exige :
  - nom ;
  - type_categorie.

  utilisateur_id reste inchangé.
*/
export const putCategorie = async (
  request,
  response
) => {
  try {
    const validationId =
      validerIdCategorie(
        request.params.id
      )

    if (!validationId.estValide) {
      return response.status(400).json({
        message: validationId.message,
      })
    }

    const validationDonnees =
      validerModificationCategorie(
        request.body
      )

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message:
          validationDonnees.message,
      })
    }

    const categorieModifiee =
      await updateCategorie(
        validationId.donnees.id,
        validationDonnees.donnees
      )

    if (!categorieModifiee) {
      return response.status(404).json({
        message: "Catégorie introuvable",
      })
    }

    response.json(categorieModifiee)
  } catch (error) {
    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Cette catégorie existe déjà pour cet utilisateur",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de la catégorie",
      error: error.message,
    })
  }
}

/*
  Supprime une catégorie grâce
  à son identifiant.

  Le service renvoie la catégorie supprimée
  grâce à la clause SQL RETURNING.
*/
export const deleteCategorieById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdCategorie(
        request.params.id
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const categorieSupprimee =
      await deleteCategorie(
        validation.donnees.id
      )

    if (!categorieSupprimee) {
      return response.status(404).json({
        message: "Catégorie introuvable",
      })
    }

    response.json({
      message:
        "Catégorie supprimée avec succès",
      categorie: categorieSupprimee,
    })
  } catch (error) {
    /*
      PostgreSQL 23503 :
      la catégorie est encore référencée
      par une autre table.

      Ici :
      - des transactions ;
      - ou des budgets.
    */
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "Impossible de supprimer cette catégorie car elle est encore utilisée dans des transactions ou des budgets",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la suppression de la catégorie",
      error: error.message,
    })
  }
}