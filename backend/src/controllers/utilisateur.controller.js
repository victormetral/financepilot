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
  → récupère l’identité depuis le JWT
  → vérifie les doublons d’email
  → hache les mots de passe

  utilisateur.validator.js
  → valide et nettoie les données

  utilisateur.service.js
  → exécute les requêtes SQL
  → limite les opérations à l’utilisateur connecté

  bcryptjs
  → transforme le mot de passe en hash sécurisé

  Règles de sécurité :
  - le mot de passe ne doit jamais apparaître
    dans une réponse JSON ;
  - l’identité fiable vient du JWT ;
  - un utilisateur ne peut agir que sur son profil ;
  - une donnée étrangère renvoie 404.
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

import {
  validerIdUtilisateur,
  validerDonneesUtilisateur,
} from "../validators/utilisateur.validator.js"

/*
  Nombre de tours utilisés par bcrypt
  pour produire le hash.
*/
const NOMBRE_TOURS_HASH = 10

/*
  Hache un mot de passe avant son stockage.

  Un hash est une représentation non réversible
  du mot de passe.
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
  Récupère uniquement l’utilisateur authentifié.

  La réponse reste un tableau pour conserver
  le fonctionnement actuel de la route GET /.
*/
export const getUtilisateurs = async (
  request,
  response
) => {
  try {
    /*
      🟨 NOUVEAU

      Cet identifiant vient du JWT vérifié
      par auth.middleware.js.
    */
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ : filtrage par utilisateur connecté.
    const utilisateurs =
      await findAllUtilisateurs(
        utilisateurId
      )

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
  Récupère un utilisateur seulement lorsque
  l’identifiant demandé correspond au JWT.
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

    // 🟨 NOUVEAU
    const utilisateurIdConnecte =
      request.utilisateur.utilisateurId

    /*
      🟨 CORRIGÉ

      Le service reçoit :
      - l’identifiant demandé dans l’URL ;
      - l’identifiant fiable contenu dans le JWT.
    */
    const utilisateur =
      await findUtilisateurById(
        validation.donnees.id,
        utilisateurIdConnecte
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

  Cette route reste publique.

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
      validerDonneesUtilisateur(
        request.body
      )

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

  L’identifiant de l’URL doit correspondre
  à l’identifiant contenu dans le JWT.

  PUT exige actuellement :
  - nom ;
  - prenom ;
  - email ;
  - mot_de_passe.
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

    const utilisateurIdDemande =
      validationId.donnees.id

    // 🟨 NOUVEAU
    const utilisateurIdConnecte =
      request.utilisateur.utilisateurId

    /*
      🟨 CORRIGÉ

      La recherche vérifie simultanément :
      - l’identifiant demandé ;
      - l’identité contenue dans le JWT.
    */
    const utilisateurActuel =
      await findUtilisateurById(
        utilisateurIdDemande,
        utilisateurIdConnecte
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
      L’utilisateur connecté peut conserver
      son adresse email actuelle.

      Un email appartenant à un autre utilisateur
      produit une erreur 409.
    */
    if (
      utilisateurAvecEmail &&
      utilisateurAvecEmail.id !==
        utilisateurIdConnecte
    ) {
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
      🟨 CORRIGÉ

      Le service reçoit dans cet ordre :
      1. l’identifiant demandé ;
      2. l’identifiant provenant du JWT ;
      3. les nouvelles données.
    */
    const utilisateurModifie =
      await updateUtilisateur(
        utilisateurIdDemande,
        utilisateurIdConnecte,
        {
          nom,
          prenom,
          email,
          mot_de_passe:
            motDePasseHash,
        }
      )

    if (!utilisateurModifie) {
      return response.status(404).json({
        message: "Utilisateur introuvable",
      })
    }

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
  Supprime uniquement l’utilisateur authentifié.

  L’identifiant demandé dans l’URL doit correspondre
  à l’identifiant contenu dans le JWT.
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

    // 🟨 NOUVEAU
    const utilisateurIdConnecte =
      request.utilisateur.utilisateurId

    /*
      🟨 CORRIGÉ

      La suppression exige la correspondance entre :
      - l’identifiant de l’URL ;
      - l’identifiant du JWT.
    */
    const utilisateurSupprime =
      await deleteUtilisateur(
        validation.donnees.id,
        utilisateurIdConnecte
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
      l’utilisateur possède encore des ressources.

      La suppression est refusée pour éviter
      de produire des données orphelines.
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