/*
  SERVICE DES UTILISATEURS

  Ce fichier contient les requêtes SQL liées
  aux utilisateurs de FinancePilot.

  Utilisé par :
  - utilisateur.controller.js

  Son rôle :
  - lire l’utilisateur authentifié ;
  - rechercher un utilisateur par email ;
  - créer, modifier et supprimer un utilisateur.

  Règles de sécurité :
  - un utilisateur ne peut consulter que son profil ;
  - il ne peut modifier que son profil ;
  - il ne peut supprimer que son profil ;
  - l’identité fiable provient du JWT ;
  - mot_de_passe ne doit jamais être renvoyé
    dans une réponse publique.

  Exception :
  findUtilisateurByEmail() renvoie le hash uniquement
  pour permettre la connexion et vérifier les doublons.

  Victor :
  évite SELECT * afin de contrôler précisément
  les colonnes récupérées par chaque requête.
*/

import { pool } from "../config/database.js"

/*
  Récupère uniquement l’utilisateur authentifié.

  La route GET /api/utilisateurs conserve
  une réponse sous forme de tableau.

  🟨 CORRIGÉ :
  elle ne renvoie plus tous les utilisateurs.
*/
export const findAllUtilisateurs = async (
  utilisateurId
) => {
  const result = await pool.query(
    `
      SELECT
        id,
        nom,
        prenom,
        email,
        date_creation
      FROM utilisateur
      WHERE id = $1
    `,
    [utilisateurId]
  )

  return result.rows
}

/*
  Recherche un utilisateur seulement lorsque :

  - l’identifiant demandé dans l’URL correspond ;
  - cet identifiant correspond aussi au JWT.

  🟨 CORRIGÉ :
  un utilisateur ne peut plus consulter
  le profil d’un autre utilisateur.
*/
export const findUtilisateurById = async (
  id,
  utilisateurId
) => {
  const result = await pool.query(
    `
      SELECT
        id,
        nom,
        prenom,
        email,
        date_creation
      FROM utilisateur
      WHERE id = $1
        AND id = $2
    `,
    [
      id,
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Recherche un utilisateur grâce à son email.

  Cette fonction renvoie volontairement mot_de_passe,
  car le hash est nécessaire :

  - pour vérifier la connexion ;
  - pour vérifier les doublons d’email.

  Cette fonction ne doit jamais être utilisée
  directement pour construire une réponse publique.
*/
export const findUtilisateurByEmail = async (
  email
) => {
  const result = await pool.query(
    `
      SELECT
        id,
        nom,
        prenom,
        email,
        mot_de_passe,
        date_creation
      FROM utilisateur
      WHERE email = $1
    `,
    [email]
  )

  return result.rows[0]
}

/*
  Crée un utilisateur.

  mot_de_passe contient déjà un hash produit
  par bcrypt dans le contrôleur.

  RETURNING exclut volontairement le hash.
*/
export const createUtilisateur = async ({
  nom,
  prenom,
  email,
  mot_de_passe,
}) => {
  const result = await pool.query(
    `
      INSERT INTO utilisateur (
        nom,
        prenom,
        email,
        mot_de_passe
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        nom,
        prenom,
        email,
        date_creation
    `,
    [
      nom,
      prenom,
      email,
      mot_de_passe,
    ]
  )

  return result.rows[0]
}

/*
  Modifie un utilisateur uniquement lorsque :

  - l’identifiant demandé correspond ;
  - l’identifiant appartient au JWT connecté.

  Le nouveau mot de passe doit déjà être haché
  avant l’appel de cette fonction.

  RETURNING exclut volontairement le hash.
*/
export const updateUtilisateur = async (
  id,
  utilisateurId,
  {
    nom,
    prenom,
    email,
    mot_de_passe,
  }
) => {
  const result = await pool.query(
    `
      UPDATE utilisateur
      SET
        nom = $1,
        prenom = $2,
        email = $3,
        mot_de_passe = $4
      WHERE id = $5
        AND id = $6
      RETURNING
        id,
        nom,
        prenom,
        email,
        date_creation
    `,
    [
      nom,
      prenom,
      email,
      mot_de_passe,
      id,
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Supprime uniquement l’utilisateur authentifié.

  Les deux identifiants doivent correspondre :
  - celui reçu dans l’URL ;
  - celui contenu dans le JWT.

  Le hash du mot de passe est exclu du résultat.
*/
export const deleteUtilisateur = async (
  id,
  utilisateurId
) => {
  const result = await pool.query(
    `
      DELETE FROM utilisateur
      WHERE id = $1
        AND id = $2
      RETURNING
        id,
        nom,
        prenom,
        email,
        date_creation
    `,
    [
      id,
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}