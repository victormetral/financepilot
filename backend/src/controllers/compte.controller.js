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

  Convention de nommage :
  - getComptes
  - getCompteById
  - postCompte
  - putCompte
  - deleteCompteById

  Règle de sécurité :
  - l’identité de l’utilisateur vient du JWT ;
  - elle est disponible dans request.utilisateur ;
  - elle est transmise au service pour chaque requête ;
  - elle ne doit jamais être choisie dans le body JSON.

  Victor :
  si une règle concernant les identifiants,
  le solde, la devise ou le type de compte change,
  modifie d’abord compte.validator.js.
*/

import {
  estErreurCleEtrangere,
} from "../utils/postgres.utils.js"

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

/*
  Récupère uniquement les comptes
  de l’utilisateur authentifié.

  Exemple :
  GET /api/comptes
*/
export const getComptes = async (
  request,
  response
) => {
  try {
    /*
      🟨 NOUVEAU

      L’identifiant provient du JWT vérifié
      par le middleware d’authentification.
    */
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ : transmission au service.
    const comptes = await findAllComptes(
      utilisateurId
    )

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
  - valide les textes ;
  - transforme le solde en nombre ;
  - applique solde_initial = 0 par défaut ;
  - applique devise = EUR par défaut ;
  - normalise la devise en majuscules.

  utilisateur_id vient du JWT vérifié
  et non du body envoyé par le client.
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

    /*
      L’opérateur ... copie les données validées,
      puis utilisateur_id est ajouté depuis le JWT.
    */
    const donneesCompte = {
      ...validation.donnees,
      utilisateur_id:
        request.utilisateur.utilisateurId,
    }

    const nouveauCompte =
      await createCompte(donneesCompte)

    response.status(201).json(nouveauCompte)
  } catch (error) {
    /*
      PostgreSQL 23503 :
      l’utilisateur du JWT n’existe plus
      dans la base de données.
    */
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "L’utilisateur authentifié n’existe pas",
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
  Récupère un compte seulement s’il appartient
  à l’utilisateur authentifié.

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

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    /*
      🟨 CORRIGÉ

      Le service reçoit :
      - l’identifiant du compte ;
      - l’identifiant de l’utilisateur connecté.
    */
    const compte = await findCompteById(
      validation.donnees.id,
      utilisateurId
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
  Modifie entièrement un compte
  seulement s’il appartient à l’utilisateur.

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

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    /*
      🟨 CORRIGÉ

      L’ordre des arguments correspond au service :
      1. identifiant du compte ;
      2. identifiant de l’utilisateur ;
      3. nouvelles données du compte.
    */
    const compteModifie =
      await updateCompte(
        validationId.donnees.id,
        utilisateurId,
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
  Supprime un compte seulement s’il appartient
  à l’utilisateur authentifié.

  Le service renvoie le compte supprimé grâce
  à la clause SQL RETURNING.
*/
export const deleteCompteById = async (
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

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ : transmission du propriétaire.
    const compteSupprime =
      await deleteCompte(
        validation.donnees.id,
        utilisateurId
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
    if (estErreurCleEtrangere(error)) {
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