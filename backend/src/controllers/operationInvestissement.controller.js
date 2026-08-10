/*
  CONTRÔLEUR DES OPÉRATIONS D'INVESTISSEMENT

  Depuis Lot 3 :
  - plus de try/catch générique ; asyncHandler transmet
    toute erreur non gérée à erreurGlobale.middleware.js ;
  - les erreurs métier (400, 404, 409) sont levées
    explicitement via ErreurHTTP.

  Utilise :
  - operationInvestissement.validator.js ;
  - operationInvestissement.service.js ;
  - request.utilisateur créé depuis le JWT.

  Règle de propriété :
  une opération appartient au propriétaire de son compte.
*/

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"
import { estErreurCleEtrangere } from "../utils/postgres.utils.js"

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

export const getOperationsInvestissement = asyncHandler(
  async (request, response) => {
    // Liste limitée aux comptes du JWT.
    const operations = await findAllOperationsInvestissement(
      request.utilisateur.utilisateurId
    )

    response.json(operations)
  }
)

export const getOperationInvestissementById = asyncHandler(
  async (request, response) => {
    const validation = validerIdOperationInvestissement(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    // Identifiant + propriétaire.
    const operation = await findOperationInvestissementById(
      validation.donnees.id,
      request.utilisateur.utilisateurId
    )

    if (!operation) {
      throw new ErreurHTTP(404, "Opération d'investissement introuvable")
    }

    response.json(operation)
  }
)

/*
  Crée une opération. Try/catch local conservé : seul cas
  pg possible ici, 23503 (compte ou actif inexistant).
*/
export const postOperationInvestissement = asyncHandler(
  async (request, response) => {
    const validation = validerCreationOperationInvestissement(request.body)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    try {
      // Vérifie le propriétaire du compte.
      const nouvelleOperation = await createOperationInvestissement(
        request.utilisateur.utilisateurId,
        validation.donnees
      )

      if (!nouvelleOperation) {
        throw new ErreurHTTP(404, "Compte ou actif financier introuvable")
      }

      response.status(201).json(nouvelleOperation)
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(
          409,
          "Le compte ou l'actif financier indiqué n'existe pas"
        )
      }
      throw error
    }
  }
)

export const putOperationInvestissement = asyncHandler(
  async (request, response) => {
    const validationId = validerIdOperationInvestissement(request.params.id)

    if (!validationId.estValide) {
      throw new ErreurHTTP(400, validationId.message)
    }

    const validationDonnees = validerModificationOperationInvestissement(
      request.body
    )

    if (!validationDonnees.estValide) {
      throw new ErreurHTTP(400, validationDonnees.message)
    }

    try {
      // Opération et nouveau compte contrôlés.
      const operationModifiee = await updateOperationInvestissement(
        validationId.donnees.id,
        request.utilisateur.utilisateurId,
        validationDonnees.donnees
      )

      if (!operationModifiee) {
        throw new ErreurHTTP(
          404,
          "Opération, compte ou actif financier introuvable"
        )
      }

      response.json(operationModifiee)
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(
          409,
          "Le compte ou l'actif financier indiqué n'existe pas"
        )
      }
      throw error
    }
  }
)

export const deleteOperationInvestissementById = asyncHandler(
  async (request, response) => {
    const validation = validerIdOperationInvestissement(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    // Suppression limitée au propriétaire.
    const operationSupprimee = await deleteOperationInvestissement(
      validation.donnees.id,
      request.utilisateur.utilisateurId
    )

    if (!operationSupprimee) {
      throw new ErreurHTTP(404, "Opération d'investissement introuvable")
    }

    response.json({
      message: "Opération d'investissement supprimée",
      operation: operationSupprimee,
    })
  }
)