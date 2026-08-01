/*
  CONTRÔLEUR DES UTILISATEURS

  Ce fichier orchestre les requêtes HTTP liées
  aux utilisateurs.

  Routes concernées :
  - GET    /api/utilisateurs
  - GET    /api/utilisateurs/:id
  - POST   /api/utilisateurs
  - PUT    /api/utilisateurs/:id
  - DELETE /api/utilisateurs/:id

  Répartition des responsabilités :

  utilisateur.controller.js
  → orchestre les requêtes HTTP
  → vérifie les doublons d’email
  → hache les mots de passe

  utilisateur.validator.js
  → valide et nettoie les données

  utilisateur.service.js
  → exécute les requêtes SQL

  bcryptjs
  → transforme le mot de passe en hash sécurisé

  Règle de sécurité importante :
  le mot de passe ne doit jamais apparaître
  dans une réponse JSON, même lorsqu’il est haché.

  Victor :
  si une règle de validation change,
  modifie d’abord utilisateur.validator.js.

  Si la méthode de sécurisation des mots de passe change,
  modifie ce contrôleur ou crée ensuite un service
  spécialisé pour l’authentification.
*/

import {
  estErreurCleEtrangere,
  estErreurDoublon,
} from "../utils/postgres.utils.js"

import bcrypt from "bcryptjs"

import {
  findAllUtilisateurs,
  findUtilisateurById,
  findUtilisateurByEmail,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
} from "../services/utilisateur.service.js"

// 🟨 NOUVEAU : validations déplacées dans un fichier spécialisé.
import {
  validerIdUtilisateur,
  validerDonneesUtilisateur,
} from "../validators/utilisateur.validator.js"

/*
  Nombre de tours utilisés par bcrypt pour générer
  un hash plus coûteux à calculer.

  Plus ce nombre est élevé :
  - plus le hash est lent à produire ;
  - plus les attaques par essais répétés sont coûteuses.

  La valeur 10 conserve le comportement actuel.
*/
const NOMBRE_TOURS_HASH = 10

/*
  Hache un mot de passe avant son stockage.

  Un hash est une représentation non réversible
  du mot de passe.

  Le mot de passe original ne doit jamais être
  enregistré directement dans PostgreSQL.
*/
const hacherMotDePasse = async (
  motDePasse
) => {
  return bcrypt.hash(
    motDePasse,
    NOMBRE_TOURS_HASH
  )
}

/*
  Récupère tous les utilisateurs.

  Exemple :
  GET /api/utilisateurs

  Le service doit sélectionner uniquement les champs
  publics et ne jamais renvoyer mot_de_passe.
*/
export const getUtilisateurs = async (
  request,
  response
) => {
  try {
    const utilisateurs =
      await findAllUtilisateurs()

    response.json(utilisateurs)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des utilisateurs",
      error: error.message,
    })
  }
}

/*
  Récupère un utilisateur précis grâce
  à son identifiant.

  Exemple :
  GET /api/utilisateurs/3
*/
export const getUtilisateurById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdUtilisateur(
        request.params.id
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const utilisateur =
      await findUtilisateurById(
        validation.donnees.id
      )

    if (!utilisateur) {
      return response.status(404).json({
        message: "Utilisateur introuvable",
      })
    }

    response.json(utilisateur)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de l’utilisateur",
      error: error.message,
    })
  }
}

/*
  Crée un nouvel utilisateur.

  Étapes :
  1. valider les données ;
  2. normaliser l’email ;
  3. vérifier que l’email est disponible ;
  4. hacher le mot de passe ;
  5. créer l’utilisateur.
*/
export const postUtilisateur = async (
  request,
  response
) => {
  try {
    const validation =
      validerDonneesUtilisateur(request.body)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const {
      nom,
      prenom,
      email,
      mot_de_passe,
    } = validation.donnees

    /*
      Cette vérification permet de renvoyer un message
      clair avant que PostgreSQL ne refuse le doublon.
    */
    const utilisateurExistant =
      await findUtilisateurByEmail(email)

    if (utilisateurExistant) {
      return response.status(409).json({
        message:
          "Un utilisateur utilise déjà cet email",
      })
    }

    const motDePasseHash =
      await hacherMotDePasse(
        mot_de_passe
      )

    /*
      Seul le hash est envoyé au service.

      Le mot de passe original n’est jamais envoyé
      à PostgreSQL.
    */
    const nouvelUtilisateur =
      await createUtilisateur({
        nom,
        prenom,
        email,
        mot_de_passe: motDePasseHash,
      })

    response
      .status(201)
      .json(nouvelUtilisateur)
  } catch (error) {
    /*
      PostgreSQL 23505 :
      une valeur soumise à une contrainte UNIQUE
      existe déjà.

      Cette sécurité reste nécessaire même si une
      vérification a déjà été faite avant l’insertion.

      Deux requêtes simultanées pourraient en effet
      tenter de créer le même email.
    */
    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Un utilisateur utilise déjà cet email",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de l’utilisateur",
      error: error.message,
    })
  }
}

/*
  Modifie entièrement un utilisateur.

  Étapes :
  1. valider l’identifiant ;
  2. vérifier que l’utilisateur existe ;
  3. valider les nouvelles données ;
  4. vérifier la disponibilité de l’email ;
  5. hacher le nouveau mot de passe ;
  6. modifier l’utilisateur.
*/
export const putUtilisateur = async (
  request,
  response
) => {
  try {
    const validationId =
      validerIdUtilisateur(
        request.params.id
      )

    if (!validationId.estValide) {
      return response.status(400).json({
        message: validationId.message,
      })
    }

    const utilisateurId =
      validationId.donnees.id

    /*
      On vérifie l’existence avant les autres traitements
      afin de renvoyer immédiatement une erreur 404.
    */
    const utilisateurActuel =
      await findUtilisateurById(
        utilisateurId
      )

    if (!utilisateurActuel) {
      return response.status(404).json({
        message: "Utilisateur introuvable",
      })
    }

    const validationDonnees =
      validerDonneesUtilisateur(
        request.body
      )

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message:
          validationDonnees.message,
      })
    }

    const {
      nom,
      prenom,
      email,
      mot_de_passe,
    } = validationDonnees.donnees

    const utilisateurAvecEmail =
      await findUtilisateurByEmail(email)

    /*
      Le même utilisateur peut conserver son email.

      L’erreur est renvoyée seulement lorsque l’email
      appartient à un autre utilisateur.
    */
    if (
      utilisateurAvecEmail &&
      utilisateurAvecEmail.id !==
        utilisateurId
    ) {
      return response.status(409).json({
        message:
          "Un utilisateur utilise déjà cet email",
      })
    }

    /*
      PUT exige actuellement un nouveau mot de passe.

      Un nouveau hash est donc produit à chaque
      modification complète.
    */
    const motDePasseHash =
      await hacherMotDePasse(
        mot_de_passe
      )

    const utilisateurModifie =
      await updateUtilisateur(
        utilisateurId,
        {
          nom,
          prenom,
          email,
          mot_de_passe: motDePasseHash,
        }
      )

    response.json(utilisateurModifie)
  } catch (error) {
    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Un utilisateur utilise déjà cet email",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de l’utilisateur",
      error: error.message,
    })
  }
}

/*
  Supprime un utilisateur grâce
  à son identifiant.

  Le service renvoie l’utilisateur supprimé grâce
  à la clause SQL RETURNING.

  Le service doit impérativement exclure
  mot_de_passe du résultat.
*/
export const deleteUtilisateurById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdUtilisateur(
        request.params.id
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const utilisateurSupprime =
      await deleteUtilisateur(
        validation.donnees.id
      )

    if (!utilisateurSupprime) {
      return response.status(404).json({
        message: "Utilisateur introuvable",
      })
    }

    response.json({
      message: "Utilisateur supprimé",
      utilisateur: utilisateurSupprime,
    })
  } catch (error) {
    /*
      PostgreSQL 23503 :
      l’utilisateur est encore référencé
      par d’autres tables.

      La suppression est refusée pour ne pas produire
      de données orphelines.
    */
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "Cet utilisateur possède encore des comptes, catégories, budgets ou objectifs",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la suppression de l’utilisateur",
      error: error.message,
    })
  }
}