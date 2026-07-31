import { pool } from "../config/database.js"

// Récupérer toutes les opérations avec le compte et l’actif associés
export const findAllOperationsInvestissement = async () => {
  const result = await pool.query(`
    SELECT
      operation_investissement.*,
      compte.nom AS nom_compte,
      actif_financier.symbole AS symbole_actif,
      actif_financier.nom AS nom_actif
    FROM operation_investissement
    JOIN compte
      ON compte.id = operation_investissement.compte_id
    JOIN actif_financier
      ON actif_financier.id =
        operation_investissement.actif_financier_id
    ORDER BY
      operation_investissement.date_operation DESC,
      operation_investissement.id DESC
  `)

  return result.rows
}

// Récupérer une opération par son identifiant
export const findOperationInvestissementById = async (
  id
) => {
  const result = await pool.query(
    `
      SELECT
        operation_investissement.*,
        compte.nom AS nom_compte,
        actif_financier.symbole AS symbole_actif,
        actif_financier.nom AS nom_actif
      FROM operation_investissement
      JOIN compte
        ON compte.id = operation_investissement.compte_id
      JOIN actif_financier
        ON actif_financier.id =
          operation_investissement.actif_financier_id
      WHERE operation_investissement.id = $1
    `,
    [id]
  )

  return result.rows[0]
}

// Créer une opération
export const createOperationInvestissement = async ({
  compte_id,
  actif_financier_id,
  type_operation,
  quantite,
  prix_unitaire,
  frais,
  date_operation,
}) => {
  const result = await pool.query(
    `
      INSERT INTO operation_investissement (
        compte_id,
        actif_financier_id,
        type_operation,
        quantite,
        prix_unitaire,
        frais,
        date_operation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      compte_id,
      actif_financier_id,
      type_operation,
      quantite,
      prix_unitaire,
      frais ?? 0,
      date_operation,
    ]
  )

  return result.rows[0]
}

// Modifier une opération
export const updateOperationInvestissement = async (
  id,
  {
    compte_id,
    actif_financier_id,
    type_operation,
    quantite,
    prix_unitaire,
    frais,
    date_operation,
  }
) => {
  const result = await pool.query(
    `
      UPDATE operation_investissement
      SET
        compte_id = $1,
        actif_financier_id = $2,
        type_operation = $3,
        quantite = $4,
        prix_unitaire = $5,
        frais = $6,
        date_operation = $7
      WHERE id = $8
      RETURNING *
    `,
    [
      compte_id,
      actif_financier_id,
      type_operation,
      quantite,
      prix_unitaire,
      frais,
      date_operation,
      id,
    ]
  )

  return result.rows[0]
}

// Supprimer une opération
export const deleteOperationInvestissement = async (
  id
) => {
  const result = await pool.query(
    `
      DELETE FROM operation_investissement
      WHERE id = $1
      RETURNING *
    `,
    [id]
  )

  return result.rows[0]
}