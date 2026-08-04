/*
  CONTRÔLEUR DES OBJECTIFS

  Utilise :
  - objectif.validator.js ;
  - objectif.service.js ;
  - request.utilisateur créé par le middleware JWT.

  Règle de sécurité :
  le propriétaire vient toujours du JWT.
*/

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

export const getObjectifs = async (
  request,
  response
) => {
  try {
    // 🟨 CORRIGÉ : liste limitée à l'utilisateur JWT.
    const objectifs = await findAllObjectifs(
      request.utilisateur.utilisateurId
    )

    response.json(objectifs)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des objectifs",
      error: error.message,
    })
  }
}

export const getObjectifById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdObjectif(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    // 🟨 CORRIGÉ : identifiant + propriétaire.
    const objectif = await findObjectifById(
      validation.donnees.id,
      request.utilisateur.utilisateurId
    )

    if (!objectif) {
      return response.status(404).json({
        message: "Objectif introuvable",
      })
    }

    response.json(objectif)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de l’objectif",
      error: error.message,
    })
  }
}

export const postObjectif = async (
  request,
  response
) => {
  try {
    const validation =
      validerCreationObjectif(request.body)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    // 🟨 CORRIGÉ : utilisateurId vient du JWT.
    const nouvelObjectif = await createObjectif(
      request.utilisateur.utilisateurId,
      validation.donnees
    )

    response.status(201).json(nouvelObjectif)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la création de l’objectif",
      error: error.message,
    })
  }
}

export const putObjectif = async (
  request,
  response
) => {
  try {
    const validationId =
      validerIdObjectif(request.params.id)

    if (!validationId.estValide) {
      return response.status(400).json({
        message: validationId.message,
      })
    }

    const validationDonnees =
      validerModificationObjectif(request.body)

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message: validationDonnees.message,
      })
    }

    // 🟨 CORRIGÉ : modification limitée au propriétaire.
    const objectifModifie = await updateObjectif(
      validationId.donnees.id,
      request.utilisateur.utilisateurId,
      validationDonnees.donnees
    )

    if (!objectifModifie) {
      return response.status(404).json({
        message: "Objectif introuvable",
      })
    }

    response.json(objectifModifie)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la modification de l’objectif",
      error: error.message,
    })
  }
}

export const deleteObjectifById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdObjectif(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    // 🟨 CORRIGÉ : suppression limitée au propriétaire.
    const objectifSupprime = await deleteObjectif(
      validation.donnees.id,
      request.utilisateur.utilisateurId
    )

    if (!objectifSupprime) {
      return response.status(404).json({
        message: "Objectif introuvable",
      })
    }

    response.json({
      message: "Objectif supprimé",
      objectif: objectifSupprime,
    })
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la suppression de l’objectif",
      error: error.message,
    })
  }
}
