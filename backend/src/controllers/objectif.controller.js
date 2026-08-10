/*
  CONTRÔLEUR DES OBJECTIFS

  Depuis Lot 3 :
  - plus de try/catch : aucun cas pg spécifique n'était géré
    ici, donc asyncHandler seul suffit ;
  - les erreurs métier (400, 404) sont levées via ErreurHTTP.

  Utilise :
  - objectif.validator.js ;
  - objectif.service.js ;
  - request.utilisateur créé par le middleware JWT.

  Règle de sécurité :
  le propriétaire vient toujours du JWT.
*/

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"

import {
  findAllObjectifs,
  findObjectifById,
  createObjectif,
  updateObjectif,
  deleteObjectif,
} from "../services/objectif.service.js"

import {
  validerIdObjectif,
  validerCreationObjectif,
  validerModificationObjectif,
} from "../validators/objectif.validator.js"

export const getObjectifs = asyncHandler(
  async (request, response) => {
    // Liste limitée à l'utilisateur JWT.
    const objectifs = await findAllObjectifs(
      request.utilisateur.utilisateurId
    )

    response.json(objectifs)
  }
)

export const getObjectifById = asyncHandler(
  async (request, response) => {
    const validation = validerIdObjectif(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    // Identifiant + propriétaire.
    const objectif = await findObjectifById(
      validation.donnees.id,
      request.utilisateur.utilisateurId
    )

    if (!objectif) {
      throw new ErreurHTTP(404, "Objectif introuvable")
    }

    response.json(objectif)
  }
)

export const postObjectif = asyncHandler(
  async (request, response) => {
    const validation = validerCreationObjectif(request.body)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    // utilisateurId vient du JWT.
    const nouvelObjectif = await createObjectif(
      request.utilisateur.utilisateurId,
      validation.donnees
    )

    response.status(201).json(nouvelObjectif)
  }
)

export const putObjectif = asyncHandler(
  async (request, response) => {
    const validationId = validerIdObjectif(request.params.id)

    if (!validationId.estValide) {
      throw new ErreurHTTP(400, validationId.message)
    }

    const validationDonnees = validerModificationObjectif(request.body)

    if (!validationDonnees.estValide) {
      throw new ErreurHTTP(400, validationDonnees.message)
    }

    // Modification limitée au propriétaire.
    const objectifModifie = await updateObjectif(
      validationId.donnees.id,
      request.utilisateur.utilisateurId,
      validationDonnees.donnees
    )

    if (!objectifModifie) {
      throw new ErreurHTTP(404, "Objectif introuvable")
    }

    response.json(objectifModifie)
  }
)

export const deleteObjectifById = asyncHandler(
  async (request, response) => {
    const validation = validerIdObjectif(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    // Suppression limitée au propriétaire.
    const objectifSupprime = await deleteObjectif(
      validation.donnees.id,
      request.utilisateur.utilisateurId
    )

    if (!objectifSupprime) {
      throw new ErreurHTTP(404, "Objectif introuvable")
    }

    response.json({
      message: "Objectif supprimé",
      objectif: objectifSupprime,
    })
  }
)