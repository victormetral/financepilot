/*
  ACCOUNT SERVICE

  Exécute les requêtes PostgreSQL liées aux comptes.

  Règle de sécurité :
  chaque requête cible uniquement les comptes
  appartenant à l'utilisateur authentifié.
*/

import { pool } from "../config/database.js"

/*
  Récupère tous les comptes de l'utilisateur.

  ORDER BY garantit un ordre stable dans le frontend.
*/
export const findAllComptes = async (utilisateurId) => {
  const result = await pool.query(
    `SELECT *
     FROM compte
     WHERE utilisateur_id = $1
     ORDER BY id ASC`,
    [utilisateurId]
  )

  return result.rows
}

/*
  Crée un compte pour l'utilisateur authentifié.

  utilisateur_id est fourni par le contrôleur,
  depuis le JWT, jamais depuis le client.
*/
export const createCompte = async ({
  utilisateur_id,
  nom,
  type_compte,
  sous_type_compte,
  solde_initial,
  devise,
}) => {
  const result = await pool.query(
    `INSERT INTO compte (
      utilisateur_id,
      nom,
      type_compte,
      sous_type_compte,
      solde_initial,
      devise
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      utilisateur_id,
      nom,
      type_compte,
      sous_type_compte,
      solde_initial,
      devise,
    ]
  )

  return result.rows[0]
}

/*
  Récupère un compte seulement s'il appartient
  à l'utilisateur authentifié.
*/
export const findCompteById = async (id, utilisateurId) => {
  const result = await pool.query(
    `SELECT *
     FROM compte
     WHERE id = $1
       AND utilisateur_id = $2`,
    [id, utilisateurId]
  )

  return result.rows[0]
}

/*
  Modifie entièrement un compte existant.

  utilisateur_id est uniquement utilisé pour vérifier
  le propriétaire : il ne peut jamais être modifié.
*/
export const updateCompte = async (
  id,
  utilisateurId,
  {
    nom,
    type_compte,
    sous_type_compte,
    solde_initial,
    devise,
  }
) => {
  const result = await pool.query(
    `UPDATE compte
     SET
       nom = $1,
       type_compte = $2,
       sous_type_compte = $3,
       solde_initial = $4,
       devise = $5
     WHERE id = $6
       AND utilisateur_id = $7
     RETURNING *`,
    [
      nom,
      type_compte,
      sous_type_compte,
      solde_initial,
      devise,
      id,
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Supprime un compte seulement s'il appartient
  à l'utilisateur authentifié.
*/
export const deleteCompte = async (id, utilisateurId) => {
  const result = await pool.query(
    `DELETE FROM compte
     WHERE id = $1
       AND utilisateur_id = $2
     RETURNING *`,
    [id, utilisateurId]
  )

  return result.rows[0]
}