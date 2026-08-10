/*
  SERVICE DES UTILISATEURS

  Rôle général :
  exécute les requêtes SQL liées aux utilisateurs
  de FinancePilot.

  Utilisé par :
  - utilisateur.controller.js
  - auth.controller.js (findUtilisateurByEmail,
    pour la connexion)

  Règles de sécurité :
  - un utilisateur ne peut consulter que son profil ;
  - il ne peut modifier que son profil ;
  - il ne peut supprimer que son profil ;
  - l'identité fiable provient du JWT ;
  - mot_de_passe ne doit jamais être renvoyé
    dans une réponse publique.

  Exception :
  findUtilisateurByEmail() renvoie le hash uniquement
  pour permettre la connexion et vérifier les doublons.

  🟨 NOUVEAU :
  findUtilisateurByEmail() renvoie désormais aussi
  role, nécessaire pour inclure le rôle dans le JWT
  à la connexion (voir auth.controller.js).
*/

import { pool } from "../config/database.js"

// Récupère uniquement l'utilisateur authentifié
// (la route GET /api/utilisateurs renvoie un tableau
// à un seul élément pour ne pas changer sa forme).
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

// Recherche un utilisateur seulement lorsque
// l'identifiant demandé correspond au JWT.
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
    [id, utilisateurId]
  )

  return result.rows[0]
}

// Recherche un utilisateur grâce à son email.
// Renvoie mot_de_passe (hash) et role : nécessaires
// pour la connexion, jamais pour une réponse publique.
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
        role,
        date_creation
      FROM utilisateur
      WHERE email = $1
    `,
    [email]
  )

  return result.rows[0]
}

// Crée un utilisateur. RETURNING exclut le hash.
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
    [nom, prenom, email, mot_de_passe]
  )

  return result.rows[0]
}

// Modifie un utilisateur uniquement si l'identifiant
// demandé correspond au JWT connecté.
export const updateUtilisateur = async (
  id,
  utilisateurId,
  { nom, prenom, email, mot_de_passe }
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
    [nom, prenom, email, mot_de_passe, id, utilisateurId]
  )

  return result.rows[0]
}

// Supprime uniquement l'utilisateur authentifié.
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
    [id, utilisateurId]
  )

  return result.rows[0]
}