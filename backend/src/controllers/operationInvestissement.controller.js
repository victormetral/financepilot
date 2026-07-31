/*
  CONTRÔLEUR DES OPÉRATIONS D’INVESTISSEMENT

  Ce fichier orchestre les requêtes HTTP liées
  aux opérations d’investissement.

  Routes concernées :
  - GET    /api/operations-investissement
  - GET    /api/operations-investissement/:id
  - POST   /api/operations-investissement
  - PUT    /api/operations-investissement/:id
  - DELETE /api/operations-investissement/:id

  Répartition des responsabilités :

  operationInvestissement.controller.js
  → orchestre les requêtes HTTP

  operationInvestissement.validator.js
  → valide, transforme et nettoie les données

  operationInvestissement.service.js
  → exécute les requêtes SQL

  Victor :
  si une règle liée aux quantités, prix, frais,
  dates ou identifiants change,
  modifie d’abord le validateur.
*/

import {
  findAllOperationsInvestissement,
  findOperationInvestissementById,
  createOperationInvestissement,
  updateOperationInvestissement,
  deleteOperationInvestissement,
} from "../services/operationInvestissement.service.js"

// 🟨 NOUVEAU : validations déplacées dans un fichier spécialisé.
import {
  validerIdOperationInvestissement,
  validerCreationOperationInvestissement,
  validerModificationOperationInvestissement,
} from "../validators/operationInvestissement.validator.js"

/*
  Récupère toutes les opérations d’investissement.

  Exemple :
  GET /api/operations-investissement
*/
export const getOperationsInvestissement =
  async (request, response) => {
    try {
      const operations =
        await findAllOperationsInvestissement()

      response.json(operations)
    } catch (error) {
      response.status(500).json({
        message:
          "Erreur lors de la récupération des opérations d’investissement",
        error: error.message,
      })
    }
  }

/*
  Récupère une opération précise grâce
  à son identifiant.

  Exemple :
  GET /api/operations-investissement/3
*/
export const getOperationInvestissementById =
  async (request, response) => {
    try {
      const validation =
        validerIdOperationInvestissement(
          request.params.id
        )

      if (!validation.estValide) {
        return response.status(400).json({
          message: validation.message,
        })
      }

      const operation =
        await findOperationInvestissementById(
          validation.donnees.id
        )

      if (!operation) {
        return response.status(404).json({
          message:
            "Opération d’investissement introuvable",
        })
      }

      response.json(operation)
    } catch (error) {
      response.status(500).json({
        message:
          "Erreur lors de la récupération de l’opération d’investissement",
        error: error.message,
      })
    }
  }

/*
  Crée une opération d’investissement.

  Le validateur :
  - vérifie les identifiants ;
  - transforme les valeurs numériques ;
  - vérifie les quantités, prix et frais ;
  - valide la date ;
  - applique frais = 0 par défaut ;
  - transforme type_operation en minuscules.
*/
export const postOperationInvestissement =
  async (request, response) => {
    try {
      const validation =
        validerCreationOperationInvestissement(
          request.body
        )

      if (!validation.estValide) {
        return response.status(400).json({
          message: validation.message,
        })
      }

      const nouvelleOperation =
        await createOperationInvestissement(
          validation.donnees
        )

      response
        .status(201)
        .json(nouvelleOperation)
    } catch (error) {
      /*
        PostgreSQL 23503 :
        une clé étrangère ne correspond
        à aucune ligne existante.

        Ici :
        - compte inexistant ;
        - actif financier inexistant.
      */
      if (error.code === "23503") {
        return response.status(409).json({
          message:
            "Le compte ou l’actif financier indiqué n’existe pas",
        })
      }

      response.status(500).json({
        message:
          "Erreur lors de la création de l’opération d’investissement",
        error: error.message,
      })
    }
  }

/*
  Modifie entièrement une opération existante.

  PUT exige toutes les données principales,
  y compris les frais.
*/
export const putOperationInvestissement =
  async (request, response) => {
    try {
      const validationId =
        validerIdOperationInvestissement(
          request.params.id
        )

      if (!validationId.estValide) {
        return response.status(400).json({
          message: validationId.message,
        })
      }

      const validationDonnees =
        validerModificationOperationInvestissement(
          request.body
        )

      if (!validationDonnees.estValide) {
        return response.status(400).json({
          message:
            validationDonnees.message,
        })
      }

      const operationModifiee =
        await updateOperationInvestissement(
          validationId.donnees.id,
          validationDonnees.donnees
        )

      if (!operationModifiee) {
        return response.status(404).json({
          message:
            "Opération d’investissement introuvable",
        })
      }

      response.json(operationModifiee)
    } catch (error) {
      if (error.code === "23503") {
        return response.status(409).json({
          message:
            "Le compte ou l’actif financier indiqué n’existe pas",
        })
      }

      response.status(500).json({
        message:
          "Erreur lors de la modification de l’opération d’investissement",
        error: error.message,
      })
    }
  }

/*
  Supprime une opération grâce à son identifiant.

  Le service renvoie la ligne supprimée grâce
  à la clause SQL RETURNING *.
*/
export const deleteOperationInvestissementById =
  async (request, response) => {
    try {
      const validation =
        validerIdOperationInvestissement(
          request.params.id
        )

      if (!validation.estValide) {
        return response.status(400).json({
          message: validation.message,
        })
      }

      const operationSupprimee =
        await deleteOperationInvestissement(
          validation.donnees.id
        )

      if (!operationSupprimee) {
        return response.status(404).json({
          message:
            "Opération d’investissement introuvable",
        })
      }

      response.json({
        message:
          "Opération d’investissement supprimée",
        operation: operationSupprimee,
      })
    } catch (error) {
      response.status(500).json({
        message:
          "Erreur lors de la suppression de l’opération d’investissement",
        error: error.message,
      })
    }
  }