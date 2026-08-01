/*
  CONTRÔLEUR DES ACTIFS FINANCIERS

  Ce fichier orchestre les requêtes HTTP liées
  aux actifs financiers.

  Routes concernées :
  - GET    /api/actifs-financiers
  - GET    /api/actifs-financiers/:id
  - POST   /api/actifs-financiers
  - PUT    /api/actifs-financiers/:id
  - DELETE /api/actifs-financiers/:id

  Répartition des responsabilités :

  actifFinancier.controller.js
  → orchestre les requêtes HTTP

  actifFinancier.validator.js
  → valide, nettoie et transforme les données

  actifFinancier.service.js
  → exécute les requêtes SQL

  Victor :
  si une règle liée au symbole, à la devise
  ou au type d’actif change,
  modifie d’abord actifFinancier.validator.js.
*/

import {
  estErreurCleEtrangere,
  estErreurDoublon,
} from "../utils/postgres.utils.js"

import {
  findAllActifsFinanciers,
  findActifFinancierById,
  createActifFinancier,
  updateActifFinancier,
  deleteActifFinancier,
} from "../services/actifFinancier.service.js"

// 🟨 NOUVEAU : validations déplacées dans un fichier spécialisé.
import {
  validerIdActifFinancier,
  validerCreationActifFinancier,
  validerModificationActifFinancier,
} from "../validators/actifFinancier.validator.js"

/*
  Récupère tous les actifs financiers.

  Exemple :
  GET /api/actifs-financiers
*/
export const getActifsFinanciers = async (
  request,
  response
) => {
  try {
    const actifs =
      await findAllActifsFinanciers()

    response.json(actifs)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des actifs financiers",
      error: error.message,
    })
  }
}

/*
  Récupère un actif financier précis
  grâce à son identifiant.

  Exemple :
  GET /api/actifs-financiers/3
*/
export const getActifFinancierById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdActifFinancier(
        request.params.id
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const actif =
      await findActifFinancierById(
        validation.donnees.id
      )

    if (!actif) {
      return response.status(404).json({
        message:
          "Actif financier introuvable",
      })
    }

    response.json(actif)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de l’actif financier",
      error: error.message,
    })
  }
}

/*
  Crée un actif financier.

  Le validateur :
  - vérifie les champs obligatoires ;
  - applique EUR par défaut ;
  - transforme symbole et devise en majuscules ;
  - retire les espaces inutiles.
*/
export const postActifFinancier = async (
  request,
  response
) => {
  try {
    const validation =
      validerCreationActifFinancier(
        request.body
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const nouvelActif =
      await createActifFinancier(
        validation.donnees
      )

    response.status(201).json(nouvelActif)
  } catch (error) {
    /*
      PostgreSQL 23505 :
      une valeur soumise à une contrainte UNIQUE
      existe déjà.

      Exemple possible :
      symbole déjà enregistré.
    */
    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Cet actif financier existe déjà",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de l’actif financier",
      error: error.message,
    })
  }
}

/*
  Modifie entièrement un actif financier.

  PUT exige :
  - symbole ;
  - nom ;
  - type_actif ;
  - devise.
*/
export const putActifFinancier = async (
  request,
  response
) => {
  try {
    const validationId =
      validerIdActifFinancier(
        request.params.id
      )

    if (!validationId.estValide) {
      return response.status(400).json({
        message: validationId.message,
      })
    }

    const validationDonnees =
      validerModificationActifFinancier(
        request.body
      )

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message:
          validationDonnees.message,
      })
    }

    const actifModifie =
      await updateActifFinancier(
        validationId.donnees.id,
        validationDonnees.donnees
      )

    if (!actifModifie) {
      return response.status(404).json({
        message:
          "Actif financier introuvable",
      })
    }

    response.json(actifModifie)
  } catch (error) {
    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Cet actif financier existe déjà",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de l’actif financier",
      error: error.message,
    })
  }
}

/*
  Supprime un actif financier grâce
  à son identifiant.

  Le service renvoie la ligne supprimée
  grâce à RETURNING *.
*/
export const deleteActifFinancierById =
  async (request, response) => {
    try {
      const validation =
        validerIdActifFinancier(
          request.params.id
        )

      if (!validation.estValide) {
        return response.status(400).json({
          message: validation.message,
        })
      }

      const actifSupprime =
        await deleteActifFinancier(
          validation.donnees.id
        )

      if (!actifSupprime) {
        return response.status(404).json({
          message:
            "Actif financier introuvable",
        })
      }

      response.json({
        message:
          "Actif financier supprimé",
        actif: actifSupprime,
      })
    } catch (error) {
      /*
        PostgreSQL 23503 :
        l’actif est encore référencé par une autre table.

        Ici :
        une opération d’investissement utilise cet actif.
      */
      if (estErreurCleEtrangere(error)) {
        return response.status(409).json({
          message:
            "Cet actif financier est utilisé par une opération d’investissement",
        })
      }

      response.status(500).json({
        message:
          "Erreur lors de la suppression de l’actif financier",
        error: error.message,
      })
    }
  }