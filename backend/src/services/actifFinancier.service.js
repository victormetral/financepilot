import { pool } from "../config/database.js"

// Récupérer tous les actifs financiers
export const findAllActifsFinanciers = async () => {
  const result = await pool.query(`
    SELECT *
    FROM actif_financier
    ORDER BY nom ASC, id ASC
  `)

  return result.rows
}

// Récupérer un actif financier par son identifiant
export const findActifFinancierById = async (id) => {
  const result = await pool.query(
    `
      SELECT *
      FROM actif_financier
      WHERE id = $1
    `,
    [id]
  )

  return result.rows[0]
}

// Créer un actif financier
export const createActifFinancier = async ({
  symbole,
  nom,
  type_actif,
  devise,
}) => {
  const result = await pool.query(
    `
      INSERT INTO actif_financier (
        symbole,
        nom,
        type_actif,
        devise
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [
      symbole,
      nom,
      type_actif,
      devise ?? "EUR",
    ]
  )

  return result.rows[0]
}

// Modifier un actif financier
export const updateActifFinancier = async (
  id,
  {
    symbole,
    nom,
    type_actif,
    devise,
  }
) => {
  const result = await pool.query(
    `
      UPDATE actif_financier
      SET
        symbole = $1,
        nom = $2,
        type_actif = $3,
        devise = $4
      WHERE id = $5
      RETURNING *
    `,
    [
      symbole,
      nom,
      type_actif,
      devise,
      id,
    ]
  )

  return result.rows[0]
}

// Supprimer un actif financier
export const deleteActifFinancier = async (id) => {
  const result = await pool.query(
    `
      DELETE FROM actif_financier
      WHERE id = $1
      RETURNING *
    `,
    [id]
  )

  return result.rows[0]
}