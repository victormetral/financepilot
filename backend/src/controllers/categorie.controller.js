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
  → récupère l’identité depuis le JWT

  categorie.validator.js
  → valide et nettoie les données

  categorie.service.js
  → exécute les requêtes SQL
  → vérifie le propriétaire

  Règle de sécurité :
  utilisateur_id vient toujours du JWT,
  jamais du JSON envoyé par le client.
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

import {
  validerIdCategorie,
  validerCreationCategorie,
  validerModificationCategorie,
} from "../validators/categorie.validator.js"

/*
  Récupère uniquement les catégories
  de l’utilisateur authentifié.
*/
export const getCategories = async (
  request,
  response
) => {
  try {
    // 🟨 NOUVEAU : identifiant extrait du JWT.
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ : filtrage par propriétaire.
    const categories =
      await findAllCategories(
        utilisateurId
      )

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
  Récupère une catégorie uniquement si elle appartient
  à l’utilisateur authentifié.
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

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ : transmission du propriétaire.
    const categorie =
      await findCategorieById(
        validation.donnees.id,
        utilisateurId
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
  Crée une catégorie pour l’utilisateur authentifié.

  Même si le client envoie utilisateur_id dans le JSON,
  cette valeur est ignorée.
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

    /*
      🟨 NOUVEAU

      ... copie les données validées.
      utilisateur_id est ensuite ajouté depuis le JWT.
    */
    const donneesCategorie = {
      ...validation.donnees,
      utilisateur_id:
        request.utilisateur.utilisateurId,
    }

    // 🟨 CORRIGÉ
    const nouvelleCategorie =
      await createCategorie(
        donneesCategorie
      )

    response
      .status(201)
      .json(nouvelleCategorie)
  } catch (error) {
    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Cette catégorie existe déjà pour cet utilisateur",
      })
    }

    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "L’utilisateur authentifié n’existe pas",
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
  Modifie une catégorie uniquement si elle appartient
  à l’utilisateur authentifié.

  PUT exige :
  - nom ;
  - type_categorie.
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

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    /*
      🟨 CORRIGÉ

      Le service reçoit :
      1. l’identifiant de la catégorie ;
      2. l’identifiant du propriétaire ;
      3. les nouvelles données.
    */
    const categorieModifiee =
      await updateCategorie(
        validationId.donnees.id,
        utilisateurId,
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
  Supprime une catégorie uniquement si elle appartient
  à l’utilisateur authentifié.
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

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ : transmission du propriétaire.
    const categorieSupprimee =
      await deleteCategorie(
        validation.donnees.id,
        utilisateurId
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
      la catégorie est encore utilisée
      par une transaction ou un budget.
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