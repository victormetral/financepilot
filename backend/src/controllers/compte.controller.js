/*
  CONTRÔLEUR DES COMPTES

  Routes concernées :
  - GET    /api/comptes
  - GET    /api/comptes/:id
  - POST   /api/comptes
  - PUT    /api/comptes/:id
  - DELETE /api/comptes/:id

  Depuis Lot 3 :
  - plus de try/catch générique ; asyncHandler transmet
    toute erreur non gérée à erreurGlobale.middleware.js ;
  - les erreurs métier (400, 404, 409) sont levées
    explicitement via ErreurHTTP.

  compte.controller.js → orchestre les requêtes HTTP
  compte.validator.js  → valide, transforme, nettoie
  compte.service.js    → exécute les requêtes SQL

  Règle de sécurité :
  utilisateur_id vient toujours du JWT,
  jamais du body JSON.
*/

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"
import { estErreurCleEtrangere } from "../utils/postgres.utils.js"

import {
  findAllComptes,
  createCompte,
  findCompteById,
  updateCompte,
  deleteCompte,
} from "../services/compte.service.js"

import {
  validerIdCompte,
  validerCreationCompte,
  validerModificationCompte,
} from "../validators/compte.validator.js"

export const getComptes = asyncHandler(
  async (request, response) => {
    const utilisateurId = request.utilisateur.utilisateurId
    const comptes = await findAllComptes(utilisateurId)
    response.json(comptes)
  }
)

/*
  Crée un compte. Try/catch local conservé : seul
  cas d'erreur pg possible ici (23503, utilisateur JWT
  disparu) nécessite un message dédié.
*/
export const postCompte = asyncHandler(
  async (request, response) => {
    const validation = validerCreationCompte(request.body)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const donneesCompte = {
      ...validation.donnees,
      utilisateur_id: request.utilisateur.utilisateurId,
    }

    try {
      const nouveauCompte = await createCompte(donneesCompte)
      response.status(201).json(nouveauCompte)
    } catch (error) {
      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(409, "L'utilisateur authentifié n'existe pas")
      }
      throw error
    }
  }
)

export const getCompteById = asyncHandler(
  async (request, response) => {
    const validation = validerIdCompte(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const utilisateurId = request.utilisateur.utilisateurId
    const compte = await findCompteById(validation.donnees.id, utilisateurId)

    if (!compte) {
      throw new ErreurHTTP(404, "Compte introuvable")
    }

    response.json(compte)
  }
)

export const putCompte = asyncHandler(
  async (request, response) => {
    const validationId = validerIdCompte(request.params.id)

    if (!validationId.estValide) {
      throw new ErreurHTTP(400, validationId.message)
    }

    const validationDonnees = validerModificationCompte(request.body)

    if (!validationDonnees.estValide) {
      throw new ErreurHTTP(400, validationDonnees.message)
    }

    const utilisateurId = request.utilisateur.utilisateurId

    const compteModifie = await updateCompte(
      validationId.donnees.id,
      utilisateurId,
      validationDonnees.donnees
    )

    if (!compteModifie) {
      throw new ErreurHTTP(404, "Compte introuvable")
    }

    response.json(compteModifie)
  }
)

/*
  Supprime un compte. Try/catch local conservé : seul
  cas d'erreur pg possible ici (23503, compte encore
  référencé par transactions/opérations) nécessite un
  message dédié.
*/
export const deleteCompteById = asyncHandler(
  async (request, response) => {
    const validation = validerIdCompte(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const utilisateurId = request.utilisateur.utilisateurId

    try {
      const compteSupprime = await deleteCompte(
        validation.donnees.id,
        utilisateurId
      )

      if (!compteSupprime) {
        throw new ErreurHTTP(404, "Compte introuvable")
      }

      response.json({
        message: "Compte supprimé avec succès",
        compte: compteSupprime,
      })
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(
          409,
          "Impossible de supprimer ce compte car il contient encore des transactions ou des opérations d'investissement"
        )
      }
      throw error
    }
  }
)