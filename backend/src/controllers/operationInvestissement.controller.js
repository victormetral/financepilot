/*
  CONTRÔLEUR DES OPÉRATIONS D'INVESTISSEMENT

  Utilise :
  - operationInvestissement.validator.js ;
  - operationInvestissement.service.js ;
  - request.utilisateur créé depuis le JWT.

  Règle de propriété :
  une opération appartient au propriétaire de son compte.
*/

import {
  estErreurCleEtrangere,
} from "../utils/postgres.utils.js"

import {
  findAllOperationsInvestissement,
  findOperationInvestissementById,
  createOperationInvestissement,
  updateOperationInvestissement,
  deleteOperationInvestissement,
} from "../services/operationInvestissement.service.js"

import {
  validerIdOperationInvestissement,
  validerCreationOperationInvestissement,
  validerModificationOperationInvestissement,
} from "../validators/operationInvestissement.validator.js"

export const getOperationsInvestissement =
  async (request, response) => {
    try {
      // 🟨 CORRIGÉ : liste limitée aux comptes du JWT.
      const operations =
        await findAllOperationsInvestissement(
          request.utilisateur.utilisateurId
        )

      response.json(operations)
    } catch (error) {
      response.status(500).json({
        message:
          "Erreur lors de la récupération des opérations d’investissement",
        error: error.message,
      })
    }
  }

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

      // 🟨 CORRIGÉ : identifiant + propriétaire.
      const operation =
        await findOperationInvestissementById(
          validation.donnees.id,
          request.utilisateur.utilisateurId
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

      // 🟨 CORRIGÉ : vérifie le propriétaire du compte.
      const nouvelleOperation =
        await createOperationInvestissement(
          request.utilisateur.utilisateurId,
          validation.donnees
        )

      if (!nouvelleOperation) {
        return response.status(404).json({
          message:
            "Compte ou actif financier introuvable",
        })
      }

      response
        .status(201)
        .json(nouvelleOperation)
    } catch (error) {
      if (estErreurCleEtrangere(error)) {
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
          message: validationDonnees.message,
        })
      }

      // 🟨 CORRIGÉ : opération et nouveau compte contrôlés.
      const operationModifiee =
        await updateOperationInvestissement(
          validationId.donnees.id,
          request.utilisateur.utilisateurId,
          validationDonnees.donnees
        )

      if (!operationModifiee) {
        return response.status(404).json({
          message:
            "Opération, compte ou actif financier introuvable",
        })
      }

      response.json(operationModifiee)
    } catch (error) {
      if (estErreurCleEtrangere(error)) {
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

      // 🟨 CORRIGÉ : suppression limitée au propriétaire.
      const operationSupprimee =
        await deleteOperationInvestissement(
          validation.donnees.id,
          request.utilisateur.utilisateurId
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
