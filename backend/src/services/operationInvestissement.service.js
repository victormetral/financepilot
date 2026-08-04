/*
  SERVICE DES OPÉRATIONS D'INVESTISSEMENT

  Utilisé par :
  - operationInvestissement.controller.js

  Règle de propriété :
  utilisateur → compte → opération d'investissement.

  actif_financier reste un référentiel global :
  il n'a pas de colonne utilisateur_id dans le schéma.
*/

import { pool } from "../config/database.js"

export const findAllOperationsInvestissement = async (
  // 🟨 NOUVEAU
  utilisateurId
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
        ON compte.id =
          operation_investissement.compte_id
      JOIN actif_financier
        ON actif_financier.id =
          operation_investissement.actif_financier_id
      WHERE compte.utilisateur_id = $1
      ORDER BY
        operation_investissement.date_operation DESC,
        operation_investissement.id DESC
    `,
    [utilisateurId]
  )

  return result.rows
}

export const findOperationInvestissementById = async (
  id,
  // 🟨 NOUVEAU
  utilisateurId
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
        ON compte.id =
          operation_investissement.compte_id
      JOIN actif_financier
        ON actif_financier.id =
          operation_investissement.actif_financier_id
      WHERE operation_investissement.id = $1
        AND compte.utilisateur_id = $2
    `,
    [id, utilisateurId]
  )

  return result.rows[0]
}

/*
  INSERT ... SELECT empêche l'utilisation du compte
  appartenant à un autre utilisateur.

  L'actif doit exister, mais il est global.
*/
export const createOperationInvestissement = async (
  // 🟨 NOUVEAU
  utilisateurId,
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
      INSERT INTO operation_investissement (
        compte_id,
        actif_financier_id,
        type_operation,
        quantite,
        prix_unitaire,
        frais,
        date_operation
      )
      SELECT $1, $2, $3, $4, $5, $6, $7
      WHERE EXISTS (
        SELECT 1
        FROM compte
        WHERE id = $1
          AND utilisateur_id = $8
      )
      AND EXISTS (
        SELECT 1
        FROM actif_financier
        WHERE id = $2
      )
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
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  La modification vérifie :
  - le propriétaire du compte actuel ;
  - le propriétaire du nouveau compte ;
  - l'existence de l'actif global.
*/
export const updateOperationInvestissement = async (
  id,
  // 🟨 NOUVEAU
  utilisateurId,
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
        AND EXISTS (
          SELECT 1
          FROM compte AS compte_actuel
          WHERE compte_actuel.id =
            operation_investissement.compte_id
            AND compte_actuel.utilisateur_id = $9
        )
        AND EXISTS (
          SELECT 1
          FROM compte AS nouveau_compte
          WHERE nouveau_compte.id = $1
            AND nouveau_compte.utilisateur_id = $9
        )
        AND EXISTS (
          SELECT 1
          FROM actif_financier
          WHERE actif_financier.id = $2
        )
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
      utilisateurId,
    ]
  )

  return result.rows[0]
}

export const deleteOperationInvestissement = async (
  id,
  // 🟨 NOUVEAU
  utilisateurId
) => {
  const result = await pool.query(
    `
      DELETE FROM operation_investissement
      WHERE id = $1
        AND EXISTS (
          SELECT 1
          FROM compte
          WHERE compte.id =
            operation_investissement.compte_id
            AND compte.utilisateur_id = $2
        )
      RETURNING *
    `,
    [id, utilisateurId]
  )

  return result.rows[0]
}
