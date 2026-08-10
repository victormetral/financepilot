/*
  SERVICE DES BUDGETS

  Utilisé par : budget.controller.js
  Règles : utilisateurId vient du JWT ; toutes les requêtes
  filtrent par utilisateur_id ; une catégorie étrangère est refusée.
*/

import { pool } from "../config/database.js"

export const findAllBudgets = async (utilisateurId, categorie_id, mois, annee, limite, offset) => {
  const valeurs = [utilisateurId]
  const conditions = ["budget.utilisateur_id = $1"]

  if (categorie_id !== undefined) {
    valeurs.push(categorie_id)
    conditions.push(`budget.categorie_id = $${valeurs.length}`)
  }

  if (mois !== undefined) {
    valeurs.push(mois)
    conditions.push(`budget.mois = $${valeurs.length}`)
  }

  if (annee !== undefined) {
    valeurs.push(annee)
    conditions.push(`budget.annee = $${valeurs.length}`)
  }

  const filtre = `WHERE ${conditions.join(" AND ")}`
  const valeursFiltres = [...valeurs]

  valeurs.push(limite)
  const numeroLimite = valeurs.length

  valeurs.push(offset)
  const numeroOffset = valeurs.length

  const resultatBudgets = await pool.query(
    `
      SELECT budget.*, categorie.nom AS nom_categorie
      FROM budget
      JOIN categorie ON categorie.id = budget.categorie_id
      ${filtre}
      ORDER BY budget.annee DESC, budget.mois DESC, budget.id DESC
      LIMIT $${numeroLimite}
      OFFSET $${numeroOffset}
    `,
    valeurs
  )

  const resultatTotal = await pool.query(
    `SELECT COUNT(*) AS total FROM budget ${filtre}`,
    valeursFiltres
  )

  return {
    budgets: resultatBudgets.rows,
    total: Number(resultatTotal.rows[0].total),
  }
}

export const findBudgetById = async (id, utilisateurId) => {
  const result = await pool.query(
    `
      SELECT budget.*, categorie.nom AS nom_categorie
      FROM budget
      JOIN categorie ON categorie.id = budget.categorie_id
      WHERE budget.id = $1 AND budget.utilisateur_id = $2
    `,
    [id, utilisateurId]
  )

  return result.rows[0]
}

// INSERT ... SELECT crée le budget uniquement si la catégorie appartient au même utilisateur.
export const createBudget = async (utilisateurId, { categorie_id, montant_limite, mois, annee }) => {
  const result = await pool.query(
    `
      INSERT INTO budget (utilisateur_id, categorie_id, montant_limite, mois, annee)
      SELECT $1, $2, $3, $4, $5
      WHERE EXISTS (SELECT 1 FROM categorie WHERE id = $2 AND utilisateur_id = $1)
      RETURNING *
    `,
    [utilisateurId, categorie_id, montant_limite, mois, annee]
  )

  return result.rows[0]
}

export const updateBudget = async (id, utilisateurId, { categorie_id, montant_limite, mois, annee }) => {
  const result = await pool.query(
    `
      UPDATE budget
      SET categorie_id = $1, montant_limite = $2, mois = $3, annee = $4
      WHERE id = $5
        AND utilisateur_id = $6
        AND EXISTS (SELECT 1 FROM categorie WHERE categorie.id = $1 AND categorie.utilisateur_id = $6)
      RETURNING *
    `,
    [categorie_id, montant_limite, mois, annee, id, utilisateurId]
  )

  return result.rows[0]
}

export const deleteBudget = async (id, utilisateurId) => {
  const result = await pool.query(
    `DELETE FROM budget WHERE id = $1 AND utilisateur_id = $2 RETURNING *`,
    [id, utilisateurId]
  )

  return result.rows[0]
}