import { pool } from "../config/database.js"

// Récupérer tous les utilisateurs
// Le mot de passe n’est jamais renvoyé
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

// Récupérer un utilisateur par son identifiant
// Le mot de passe n’est jamais renvoyé
export const findUtilisateurById = async (id) => {
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

// Récupérer un utilisateur par email
// Cette fonction renvoie aussi le hash du mot de passe
// Elle servira plus tard pour la connexion
export const findUtilisateurByEmail = async (
  email
) => {
  const result = await pool.query(
    `
      SELECT *
      FROM utilisateur
      WHERE email = $1
    `,
    [email]
  )

  return result.rows[0]
}

// Créer un utilisateur
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

// Modifier un utilisateur
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

// Supprimer un utilisateur
// Le mot de passe n’est pas renvoyé
export const deleteUtilisateur = async (id) => {
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