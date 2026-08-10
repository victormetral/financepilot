/*
  SERVICE DES ACTIFS FINANCIERS

  Rôle général :
  exécute les requêtes SQL liées au référentiel
  des actifs financiers (actions, ETF, crypto...).

  Utilisé par :
  - actifFinancier.controller.js

  Particularité :
  actif_financier est un référentiel global partagé
  entre tous les utilisateurs. Il n'a pas de colonne
  utilisateur_id : aucune requête ne filtre donc par
  propriétaire ici (contrairement à compte.service.js
  ou budget.service.js).

  Victor :
  les colonnes sont listées explicitement (pas de
  SELECT *) pour garder le contrôle sur ce qui est
  renvoyé, même si aucune donnée sensible n'est
  stockée dans cette table.
*/

import { pool } from "../config/database.js"

// Récupère tous les actifs financiers du référentiel.
export const findAllActifsFinanciers = async () => {
  const result = await pool.query(`
    SELECT
      id,
      symbole,
      nom,
      type_actif,
      devise
    FROM actif_financier
    ORDER BY nom ASC, id ASC
  `)

  return result.rows
}

// Récupère un actif financier précis grâce à son identifiant.
export const findActifFinancierById = async (id) => {
  const result = await pool.query(
    `
      SELECT
        id,
        symbole,
        nom,
        type_actif,
        devise
      FROM actif_financier
      WHERE id = $1
    `,
    [id]
  )

  return result.rows[0]
}

// Crée un actif financier. devise vaut EUR par défaut
// si aucune devise n'est fournie.
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

// Modifie entièrement un actif financier existant.
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

// Supprime un actif financier.
// Échoue avec une erreur PostgreSQL 23503 (clé étrangère)
// si l'actif est encore référencé par une opération
// d'investissement : c'est le contrôleur qui traduit
// cette erreur en réponse HTTP 409.
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