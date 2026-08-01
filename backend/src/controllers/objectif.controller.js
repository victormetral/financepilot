/*
  CONTRÔLEUR DES OBJECTIFS FINANCIERS

  Ce fichier orchestre les requêtes HTTP liées aux objectifs.

  Il doit rester simple :
  - récupérer les données de la requête ;
  - appeler objectif.validator.js ;
  - appeler objectif.service.js ;
  - renvoyer la réponse HTTP.

  Répartition des responsabilités :

  objectif.controller.js
  → orchestre les requêtes HTTP

  objectif.validator.js
  → valide et transforme les données

  objectif.service.js
  → exécute les requêtes SQL

  Victor :
  si une règle liée aux montants, aux dates,
  aux statuts ou aux identifiants change,
  modifie d’abord objectif.validator.js.
*/

import {
  estErreurCleEtrangere,
} from "../utils/postgres.utils.js"

import {
  findAllObjectifs,
  findObjectifById,
  createObjectif,
  updateObjectif,
  deleteObjectif,
} from "../services/objectif.service.js"

// 🟨 NOUVEAU : les validations sont déplacées
// dans un fichier spécialisé.
import {
  validerIdObjectif,
  validerCreationObjectif,
  validerModificationObjectif,
} from "../validators/objectif.validator.js"

/*
  Récupère tous les objectifs financiers.

  Exemple :
  GET /api/objectifs
*/
export const getObjectifs = async (
  request,
  response
) => {
  try {
    const objectifs = await findAllObjectifs()

    response.json(objectifs)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des objectifs",
      error: error.message,
    })
  }
}

/*
  Récupère un objectif précis grâce à son identifiant.

  Exemple :
  GET /api/objectifs/3
*/
export const getObjectifById = async (
  request,
  response
) => {
  try {
    /*
      Le validateur transforme l’identifiant reçu
      sous forme de texte en nombre, puis le vérifie.
    */
    const validation =
      validerIdObjectif(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const objectif = await findObjectifById(
      validation.donnees.id
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

/*
  Crée un nouvel objectif.

  Le validateur de création gère notamment
  les valeurs par défaut :

  - montant_actuel = 0 ;
  - date_echeance = null ;
  - statut = "en cours".
*/
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

    const nouvelObjectif =
      await createObjectif(validation.donnees)

    response.status(201).json(nouvelObjectif)
  } catch (error) {
    /*
      PostgreSQL 23503 :
      une clé étrangère ne correspond à aucune ligne.

      Ici, cela signifie généralement que
      utilisateur_id ne correspond à aucun utilisateur.
    */
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "L’utilisateur indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de l’objectif",
      error: error.message,
    })
  }
}

/*
  Modifie entièrement un objectif existant.

  PUT attend toutes les données principales.

  L’identifiant et le contenu JSON sont validés
  séparément pour produire des messages précis.
*/
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
      validerModificationObjectif(
        request.body
      )

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message: validationDonnees.message,
      })
    }

    const objectifModifie =
      await updateObjectif(
        validationId.donnees.id,
        validationDonnees.donnees
      )

    if (!objectifModifie) {
      return response.status(404).json({
        message: "Objectif introuvable",
      })
    }

    response.json(objectifModifie)
  } catch (error) {
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "L’utilisateur indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de l’objectif",
      error: error.message,
    })
  }
}

/*
  Supprime un objectif grâce à son identifiant.

  Le service renvoie l’objectif supprimé grâce
  à la clause SQL RETURNING *.
*/
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

    const objectifSupprime =
      await deleteObjectif(
        validation.donnees.id
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