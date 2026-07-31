/*
  CONTRÔLEUR DES COMPTES

  Ce fichier orchestre les requêtes HTTP liées
  aux comptes bancaires.

  Routes concernées :
  - GET    /api/comptes
  - GET    /api/comptes/:id
  - POST   /api/comptes
  - PUT    /api/comptes/:id
  - DELETE /api/comptes/:id

  Répartition des responsabilités :

  compte.controller.js
  → orchestre les requêtes HTTP

  compte.validator.js
  → valide, transforme et nettoie les données

  compte.service.js
  → exécute les requêtes SQL

  Victor :
  si une règle concernant les identifiants,
  le solde, la devise ou le type de compte change,
  modifie d’abord compte.validator.js.
*/

import {
  findAllComptes,
  createCompte,
  findCompteById,
  updateCompte,
  deleteCompte,
} from "../services/compte.service.js"

// 🟨 NOUVEAU : validations déplacées
// dans un fichier spécialisé.
import {
  validerIdCompte,
  validerCreationCompte,
  validerModificationCompte,
} from "../validators/compte.validator.js"

/*
  Récupère tous les comptes.

  Exemple :
  GET /api/comptes
*/
export const getComptes = async (
  request,
  response
) => {
  try {
    const comptes = await findAllComptes()

    response.json(comptes)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des comptes",
      error: error.message,
    })
  }
}

/*
  Crée un nouveau compte.

  Le validateur :
  - vérifie utilisateur_id ;
  - valide les textes ;
  - transforme le solde en nombre ;
  - applique solde_initial = 0 par défaut ;
  - applique devise = EUR par défaut ;
  - normalise la devise en majuscules.
*/
export const postCompte = async (
  request,
  response
) => {
  try {
    const validation =
      validerCreationCompte(request.body)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const nouveauCompte =
      await createCompte(validation.donnees)

    response.status(201).json(nouveauCompte)
  } catch (error) {
    /*
      PostgreSQL 23503 :
      utilisateur_id ne correspond à aucun utilisateur.
    */
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "L’utilisateur indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création du compte",
      error: error.message,
    })
  }
}

/*
  Récupère un compte précis grâce
  à l’identifiant placé dans l’URL.

  Exemple :
  GET /api/comptes/3
*/
export const getCompteById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdCompte(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const compte = await findCompteById(
      validation.donnees.id
    )

    if (!compte) {
      return response.status(404).json({
        message: "Compte introuvable",
      })
    }

    response.json(compte)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération du compte",
      error: error.message,
    })
  }
}

/*
  Modifie entièrement un compte.

  PUT exige :
  - nom ;
  - type_compte ;
  - solde_initial ;
  - devise.

  utilisateur_id reste inchangé.
*/
export const putCompte = async (
  request,
  response
) => {
  try {
    const validationId =
      validerIdCompte(request.params.id)

    if (!validationId.estValide) {
      return response.status(400).json({
        message: validationId.message,
      })
    }

    const validationDonnees =
      validerModificationCompte(
        request.body
      )

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message:
          validationDonnees.message,
      })
    }

    const compteModifie =
      await updateCompte(
        validationId.donnees.id,
        validationDonnees.donnees
      )

    if (!compteModifie) {
      return response.status(404).json({
        message: "Compte introuvable",
      })
    }

    response.json(compteModifie)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la modification du compte",
      error: error.message,
    })
  }
}

/*
  Supprime un compte grâce à son identifiant.

  Le service renvoie le compte supprimé grâce
  à la clause SQL RETURNING *.
*/
export const removeCompte = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdCompte(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const compteSupprime =
      await deleteCompte(
        validation.donnees.id
      )

    if (!compteSupprime) {
      return response.status(404).json({
        message: "Compte introuvable",
      })
    }

    response.json({
      message:
        "Compte supprimé avec succès",
      compte: compteSupprime,
    })
  } catch (error) {
    /*
      PostgreSQL 23503 :
      le compte est encore référencé par une autre table.

      Ici, il possède encore :
      - des transactions ;
      - ou des opérations d’investissement.
    */
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Impossible de supprimer ce compte car il contient encore des transactions ou des opérations d’investissement",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la suppression du compte",
      error: error.message,
    })
  }
}