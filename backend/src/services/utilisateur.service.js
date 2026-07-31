/*
  SERVICE DES UTILISATEURS

  Ce fichier contient les requêtes SQL liées
  aux utilisateurs de FinancePilot.

  Utilisé par :
  - utilisateur.controller.js

  Son rôle :
  - lire les utilisateurs ;
  - rechercher un utilisateur par email ;
  - créer, modifier et supprimer un utilisateur.

  Règle de sécurité importante :
  mot_de_passe ne doit jamais être renvoyé par les
  fonctions destinées aux réponses publiques.

  Exception :
  findUtilisateurByEmail() renvoie le hash uniquement
  pour permettre plus tard la vérification lors
  de la connexion.

  Victor :
  évite SELECT * afin de contrôler précisément
  les colonnes récupérées par chaque requête.
*/

import { pool } from "../config/database.js"

/*
  Récupère tous les utilisateurs.

  Le hash du mot de passe est volontairement exclu.
*/
export const findAllUtilisateurs = async () => {
  const result = await pool.query(`
    SELECT
      id,
      nom,
      prenom,
      email,
      date_creation
    FROM utilisateur
    ORDER BY
      date_creation DESC,
      id DESC
  `)

  return result.rows
}

/*
  Récupère un utilisateur grâce à son identifiant.

  Le hash du mot de passe est volontairement exclu.
*/
export const findUtilisateurById = async (
  id
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
    [id]
  )

  return result.rows[0]
}

/*
  Recherche un utilisateur grâce à son email.

  Cette fonction renvoie volontairement mot_de_passe,
  car le hash sera nécessaire plus tard pour comparer
  le mot de passe envoyé lors de la connexion.

  Cette fonction ne doit pas être utilisée directement
  pour construire une réponse publique.
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
  Modifie entièrement un utilisateur.

  Le nouveau mot de passe doit déjà être haché
  avant l’appel de cette fonction.

  RETURNING exclut volontairement le hash.
*/
export const updateUtilisateur = async (
  id,
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
    ]
  )

  return result.rows[0]
}

/*
  Supprime un utilisateur grâce à son identifiant.

  RETURNING permet au contrôleur de confirmer
  précisément quel utilisateur a été supprimé.

  Le hash du mot de passe est volontairement exclu.
*/
export const deleteUtilisateur = async (
  id
) => {
  const result = await pool.query(
    `
      DELETE FROM utilisateur
      WHERE id = $1
      RETURNING
        id,
        nom,
        prenom,
        email,
        date_creation
    `,
    [id]
  )

  return result.rows[0]
}