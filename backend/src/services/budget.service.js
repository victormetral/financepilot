import { pool } from "../config/database.js"

export const findAllBudgets = async (
  utilisateur_id,
  categorie_id,
  mois,
  annee,
  limite, 
  offset 
) => {
  const valeurs = []
  const conditions = []

  if (utilisateur_id !== undefined) {
    valeurs.push(utilisateur_id)

    conditions.push(
      `budget.utilisateur_id = $${valeurs.length}`
    )
  }

  if (categorie_id !== undefined) {
    valeurs.push(categorie_id)

    conditions.push(
      `budget.categorie_id = $${valeurs.length}`
    )
  }

  if (mois !== undefined) {
    valeurs.push(mois)

    conditions.push(
      `budget.mois = $${valeurs.length}`
    )
  }

  if (annee !== undefined) {
    valeurs.push(annee)

    conditions.push(
      `budget.annee = $${valeurs.length}`
    )
  }

  const filtre =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : ""

  const valeursFiltres = [...valeurs]

  valeurs.push(limite)
  const numeroLimite = valeurs.length

  valeurs.push(offset)
  const numeroOffset = valeurs.length

  const resultatBudgets = await pool.query(
    `
      SELECT
        budget.*,
        categorie.nom AS nom_categorie
      FROM budget
      JOIN categorie
        ON categorie.id = budget.categorie_id
      ${filtre}
      ORDER BY
        budget.annee DESC,
        budget.mois DESC,
        budget.id DESC
      LIMIT $${numeroLimite}
      OFFSET $${numeroOffset}
    `,
    valeurs
  )

  const resultatTotal = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM budget
      ${filtre}
    `,
    valeursFiltres
  )

  return {
    budgets: resultatBudgets.rows,
    total: Number(resultatTotal.rows[0].total),
  }
}

export const findBudgetById = async (id) => {
  const result = await pool.query(
    `
      SELECT
        budget.*,
        categorie.nom AS nom_categorie
      FROM budget
      JOIN categorie
        ON categorie.id = budget.categorie_id
      WHERE budget.id = $1
    `,
    [id]
  )

  return result.rows[0]
}

export const createBudget = async ({
  utilisateur_id,
  categorie_id,
  montant_maximum,
  mois,
  annee,
}) => {
  const result = await pool.query(
    `
      INSERT INTO budget (
        utilisateur_id,
        categorie_id,
        montant_maximum,
        mois,
        annee
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      utilisateur_id,
      categorie_id,
      montant_maximum,
      mois,
      annee,
    ]
  )

  return result.rows[0]
}

export const updateBudget = async (
  id,
  {
    utilisateur_id,
    categorie_id,
    montant_maximum,
    mois,
    annee,
  }
) => {
  const result = await pool.query(
    `
      UPDATE budget
      SET
        utilisateur_id = $1,
        categorie_id = $2,
        montant_maximum = $3,
        mois = $4,
        annee = $5
      WHERE id = $6
      RETURNING *
    `,
    [
      utilisateur_id,
      categorie_id,
      montant_maximum,
      mois,
      annee,
      id,
    ]
  )

  return result.rows[0]
}

export const deleteBudget = async (id) => {
  const result = await pool.query(
    `
      DELETE FROM budget
      WHERE id = $1
      RETURNING *
    `,
    [id]
  )

  return result.rows[0]
}