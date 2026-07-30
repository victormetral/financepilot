import { pool } from "../config/database.js"

export const findAllTransactions = async (
  compte_id,
  categorie_id,
  type_transaction,
  date_debut,
  date_fin,
  recherche,
  limite,
  offset
) => {
  const valeurs = []
  const conditions = []

  if (compte_id) {
    valeurs.push(compte_id)

    conditions.push(
      `transaction_financiere.compte_id = $${valeurs.length}`
    )
  }

  if (categorie_id) {
    valeurs.push(categorie_id)

    conditions.push(
      `transaction_financiere.categorie_id = $${valeurs.length}`
    )
  }

  if (type_transaction) {
    valeurs.push(type_transaction)

    conditions.push(
      `transaction_financiere.type_transaction = $${valeurs.length}`
    )
  }

  if (date_debut) {
    valeurs.push(date_debut)

    conditions.push(
      `transaction_financiere.date_transaction >= $${valeurs.length}`
    )
  }

  if (date_fin) {
    valeurs.push(date_fin)

    conditions.push(
      `transaction_financiere.date_transaction <= $${valeurs.length}`
    )
  }

  if (recherche) {
    valeurs.push(`%${recherche}%`)

    conditions.push(
      `transaction_financiere.libelle ILIKE $${valeurs.length}`
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

  const resultatTransactions = await pool.query(
    `
      SELECT
        transaction_financiere.*,
        compte.nom AS nom_compte,
        categorie.nom AS nom_categorie
      FROM transaction_financiere
      JOIN compte
        ON compte.id = transaction_financiere.compte_id
      LEFT JOIN categorie
        ON categorie.id = transaction_financiere.categorie_id
      ${filtre}
      ORDER BY
        date_transaction DESC,
        transaction_financiere.id DESC
      LIMIT $${numeroLimite}
      OFFSET $${numeroOffset}
    `,
    valeurs
  )

  const resultatTotal = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM transaction_financiere
      ${filtre}
    `,
    valeursFiltres
  )

  return {
    transactions: resultatTransactions.rows,
    total: Number(resultatTotal.rows[0].total),
  }
}

export const findTransactionById = async (id) => {
  const result = await pool.query(
    `
      SELECT
        transaction_financiere.*,
        compte.nom AS nom_compte,
        categorie.nom AS nom_categorie
      FROM transaction_financiere
      JOIN compte
        ON compte.id = transaction_financiere.compte_id
      LEFT JOIN categorie
        ON categorie.id = transaction_financiere.categorie_id
      WHERE transaction_financiere.id = $1
    `,
    [id]
  )

  return result.rows[0]
}

export const createTransaction = async ({
  compte_id,
  categorie_id,
  libelle,
  montant,
  date_transaction,
  type_transaction,
}) => {
  const result = await pool.query(
    `
      INSERT INTO transaction_financiere (
        compte_id,
        categorie_id,
        libelle,
        montant,
        date_transaction,
        type_transaction
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      compte_id,
      categorie_id ?? null,
      libelle,
      montant,
      date_transaction,
      type_transaction,
    ]
  )

  return result.rows[0]
}

export const updateTransaction = async (
  id,
  {
    compte_id,
    categorie_id,
    libelle,
    montant,
    date_transaction,
    type_transaction,
  }
) => {
  const result = await pool.query(
    `
      UPDATE transaction_financiere
      SET
        compte_id = $1,
        categorie_id = $2,
        libelle = $3,
        montant = $4,
        date_transaction = $5,
        type_transaction = $6
      WHERE id = $7
      RETURNING *
    `,
    [
      compte_id,
      categorie_id ?? null,
      libelle,
      montant,
      date_transaction,
      type_transaction,
      id,
    ]
  )

  return result.rows[0]
}

export const deleteTransaction = async (id) => {
  const result = await pool.query(
    `
      DELETE FROM transaction_financiere
      WHERE id = $1
      RETURNING *
    `,
    [id]
  )

  return result.rows[0]
}