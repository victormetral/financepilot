import { pool } from "../config/database.js"

// Récupérer tous les objectifs
export const findAllObjectifs = async () => {
  const result = await pool.query(`
    SELECT *
    FROM objectif
    ORDER BY
      date_creation DESC,
      id DESC
  `)

  return result.rows
}

// Récupérer un objectif par son identifiant
export const findObjectifById = async (id) => {
  const result = await pool.query(
    `
      SELECT *
      FROM objectif
      WHERE id = $1
    `,
    [id]
  )

  return result.rows[0]
}

// Créer un objectif
export const createObjectif = async ({
  utilisateur_id,
  nom,
  montant_cible,
  montant_actuel,
  date_echeance,
  statut,
}) => {
  const result = await pool.query(
    `
      INSERT INTO objectif (
        utilisateur_id,
        nom,
        montant_cible,
        montant_actuel,
        date_echeance,
        statut
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      utilisateur_id,
      nom,
      montant_cible,
      montant_actuel ?? 0,
      date_echeance ?? null,
      statut ?? "en cours",
    ]
  )

  return result.rows[0]
}

// Modifier un objectif
export const updateObjectif = async (
  id,
  {
    utilisateur_id,
    nom,
    montant_cible,
    montant_actuel,
    date_echeance,
    statut,
  }
) => {
  const result = await pool.query(
    `
      UPDATE objectif
      SET
        utilisateur_id = $1,
        nom = $2,
        montant_cible = $3,
        montant_actuel = $4,
        date_echeance = $5,
        statut = $6
      WHERE id = $7
      RETURNING *
    `,
    [
      utilisateur_id,
      nom,
      montant_cible,
      montant_actuel,
      date_echeance ?? null,
      statut,
      id,
    ]
  )

  return result.rows[0]
}

// Supprimer un objectif
export const deleteObjectif = async (id) => {
  const result = await pool.query(
    `
      DELETE FROM objectif
      WHERE id = $1
      RETURNING *
    `,
    [id]
  )

  return result.rows[0]
}