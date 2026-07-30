import { pool } from "../config/database.js"

export const findAllCategories = async () => {
  const result = await pool.query(
    "SELECT * FROM categorie ORDER BY id"
  )

  return result.rows
}

export const findCategorieById = async (id) => {
  const result = await pool.query(
    "SELECT * FROM categorie WHERE id = $1",
    [id]
  )

  return result.rows[0]
}

export const createCategorie = async ({
  utilisateur_id,
  nom,
  type_categorie,
}) => {
  const result = await pool.query(
    `
      INSERT INTO categorie (
        utilisateur_id,
        nom,
        type_categorie
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `,
    [
      utilisateur_id,
      nom,
      type_categorie,
    ]
  )

  return result.rows[0]
}

export const updateCategorie = async (
  id,
  {
    nom,
    type_categorie,
  }
) => {
  const result = await pool.query(
    `
      UPDATE categorie
      SET
        nom = $1,
        type_categorie = $2
      WHERE id = $3
      RETURNING *
    `,
    [
      nom,
      type_categorie,
      id,
    ]
  )

  return result.rows[0]
}

export const deleteCategorie = async (id) => {
  const result = await pool.query(
    `
      DELETE FROM categorie
      WHERE id = $1
      RETURNING *
    `,
    [id]
  )

  return result.rows[0]
}