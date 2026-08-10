/*
  CONTRÔLEUR DES ACTIFS FINANCIERS

  Routes concernées :
  - GET    /api/actifs-financiers
  - GET    /api/actifs-financiers/:id
  - POST   /api/actifs-financiers
  - PUT    /api/actifs-financiers/:id
  - DELETE /api/actifs-financiers/:id

  Depuis Lot 3 :
  - plus de try/catch générique ; asyncHandler transmet
    toute erreur non gérée à erreurGlobale.middleware.js ;
  - les erreurs métier (400, 404, 409) sont levées
    explicitement via ErreurHTTP.

  actifFinancier.controller.js → orchestre les requêtes HTTP
  actifFinancier.validator.js  → valide, nettoie, transforme
  actifFinancier.service.js    → exécute les requêtes SQL

  Victor :
  si une règle liée au symbole, à la devise
  ou au type d'actif change,
  modifie d'abord actifFinancier.validator.js.
*/

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"

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

import {
  validerIdActifFinancier,
  validerCreationActifFinancier,
  validerModificationActifFinancier,
} from "../validators/actifFinancier.validator.js"

export const getActifsFinanciers = asyncHandler(
  async (request, response) => {
    const actifs = await findAllActifsFinanciers()
    response.json(actifs)
  }
)

export const getActifFinancierById = asyncHandler(
  async (request, response) => {
    const validation = validerIdActifFinancier(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const actif = await findActifFinancierById(validation.donnees.id)

    if (!actif) {
      throw new ErreurHTTP(404, "Actif financier introuvable")
    }

    response.json(actif)
  }
)

/*
  Crée un actif financier. Try/catch local conservé :
  seul cas pg possible ici, 23505 (symbole déjà enregistré).
*/
export const postActifFinancier = asyncHandler(
  async (request, response) => {
    const validation = validerCreationActifFinancier(request.body)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    try {
      const nouvelActif = await createActifFinancier(validation.donnees)
      response.status(201).json(nouvelActif)
    } catch (error) {
      if (estErreurDoublon(error)) {
        throw new ErreurHTTP(409, "Cet actif financier existe déjà")
      }
      throw error
    }
  }
)

export const putActifFinancier = asyncHandler(
  async (request, response) => {
    const validationId = validerIdActifFinancier(request.params.id)

    if (!validationId.estValide) {
      throw new ErreurHTTP(400, validationId.message)
    }

    const validationDonnees = validerModificationActifFinancier(request.body)

    if (!validationDonnees.estValide) {
      throw new ErreurHTTP(400, validationDonnees.message)
    }

    try {
      const actifModifie = await updateActifFinancier(
        validationId.donnees.id,
        validationDonnees.donnees
      )

      if (!actifModifie) {
        throw new ErreurHTTP(404, "Actif financier introuvable")
      }

      response.json(actifModifie)
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      if (estErreurDoublon(error)) {
        throw new ErreurHTTP(409, "Cet actif financier existe déjà")
      }
      throw error
    }
  }
)

/*
  Supprime un actif financier. Try/catch local conservé :
  seul cas pg possible ici, 23503 (encore utilisé par une
  opération d'investissement).
*/
export const deleteActifFinancierById = asyncHandler(
  async (request, response) => {
    const validation = validerIdActifFinancier(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    try {
      const actifSupprime = await deleteActifFinancier(
        validation.donnees.id
      )

      if (!actifSupprime) {
        throw new ErreurHTTP(404, "Actif financier introuvable")
      }

      response.json({
        message: "Actif financier supprimé",
        actif: actifSupprime,
      })
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(
          409,
          "Cet actif financier est utilisé par une opération d'investissement"
        )
      }
      throw error
    }
  }
)