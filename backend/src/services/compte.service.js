import { pool } from "../config/database.js"

export const findAllComptes = async () => {
  const result = await pool.query("SELECT * FROM compte")

  return result.rows
}

export const createCompte = async ({
  utilisateur_id,
  nom,
  type_compte,
  solde_initial,
  devise,
}) => {
  const result = await pool.query(
    `
      INSERT INTO compte (
        utilisateur_id,
        nom,
        type_compte,
        solde_initial,
        devise
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      utilisateur_id,
      nom,
      type_compte,
      solde_initial,
      devise,
    ]
  )

  return result.rows[0]
}

export const findCompteById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM compte WHERE id = $1",
    [id]
  )

  return result.rows[0]
}

export const updateCompte = async (
  id,
  {
    nom,
    type_compte,
    solde_initial,
    devise,
  }
) => {
  const result = await pool.query(
    `
      UPDATE compte
      SET
        nom = $1,
        type_compte = $2,
        solde_initial = $3,
        devise = $4
      WHERE id = $5
      RETURNING *
    `,
    [
      nom,
      type_compte,
      solde_initial,
      devise,
      id,
    ]
  )

  return result.rows[0]
}

export const deleteCompte = async (id) => {
  const result = await pool.query(
    `
      DELETE FROM compte
      WHERE id = $1
      RETURNING *
    `,
    [id]
  )

  return result.rows[0]
} 