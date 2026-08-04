/*
  SERVICE DES OBJECTIFS

  Utilisé par :
  - objectif.controller.js

  Règle de sécurité :
  chaque requête utilise utilisateurId provenant du JWT.
*/

import { pool } from "../config/database.js"

export const findAllObjectifs = async (
  // 🟨 NOUVEAU
  utilisateurId
) => {
  const result = await pool.query(
    `
      SELECT *
      FROM objectif
      WHERE utilisateur_id = $1
      ORDER BY
        date_creation DESC,
        id DESC
    `,
    [utilisateurId]
  )

  return result.rows
}

export const findObjectifById = async (
  id,
  // 🟨 NOUVEAU
  utilisateurId
) => {
  const result = await pool.query(
    `
      SELECT *
      FROM objectif
      WHERE id = $1
        AND utilisateur_id = $2
    `,
    [id, utilisateurId]
  )

  return result.rows[0]
}

export const createObjectif = async (
  // 🟨 NOUVEAU : propriétaire imposé par le JWT.
  utilisateurId,
  {
    nom,
    montant_cible,
    montant_actuel,
    date_echeance,
    statut,
  }
) => {
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
      utilisateurId,
      nom,
      montant_cible,
      montant_actuel ?? 0,
      date_echeance ?? null,
      statut ?? "en cours",
    ]
  )

  return result.rows[0]
}

export const updateObjectif = async (
  id,
  // 🟨 NOUVEAU
  utilisateurId,
  {
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
        nom = $1,
        montant_cible = $2,
        montant_actuel = $3,
        date_echeance = $4,
        statut = $5
      WHERE id = $6
        AND utilisateur_id = $7
      RETURNING *
    `,
    [
      nom,
      montant_cible,
      montant_actuel,
      date_echeance ?? null,
      statut,
      id,
      utilisateurId,
    ]
  )

  return result.rows[0]
}

export const deleteObjectif = async (
  id,
  // 🟨 NOUVEAU
  utilisateurId
) => {
  const result = await pool.query(
    `
      DELETE FROM objectif
      WHERE id = $1
        AND utilisateur_id = $2
      RETURNING *
    `,
    [id, utilisateurId]
  )

  return result.rows[0]
}
