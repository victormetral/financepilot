/*
  SERVICE DES CATÉGORIES

  Ce fichier exécute les requêtes SQL liées
  aux catégories.

  Utilisé par :
  - categorie.controller.js

  Règles de sécurité :
  - chaque catégorie appartient à un utilisateur ;
  - utilisateur_id provient du JWT ;
  - chaque lecture, modification et suppression
    vérifie le propriétaire.
*/

import { pool } from "../config/database.js"

/*
  Récupère uniquement les catégories
  de l’utilisateur authentifié.
*/
export const findAllCategories = async (
  utilisateurId
) => {
  // 🟨 CORRIGÉ : ajout du filtre utilisateur_id.
  const result = await pool.query(
    `
      SELECT *
      FROM categorie
      WHERE utilisateur_id = $1
      ORDER BY id
    `,
    [utilisateurId]
  )

  return result.rows
}

/*
  Recherche une catégorie grâce :
  - à son identifiant ;
  - à l’identifiant de son propriétaire.
*/
export const findCategorieById = async (
  id,
  utilisateurId
) => {
  // 🟨 CORRIGÉ : vérification du propriétaire.
  const result = await pool.query(
    `
      SELECT *
      FROM categorie
      WHERE id = $1
        AND utilisateur_id = $2
    `,
    [
      id,
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Crée une catégorie pour l’utilisateur authentifié.

  utilisateur_id a été ajouté par le contrôleur
  à partir du JWT.
*/
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

/*
  Modifie une catégorie uniquement si elle appartient
  à l’utilisateur authentifié.

  utilisateur_id ne peut pas être modifié.
*/
export const updateCategorie = async (
  id,
  utilisateurId,
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
        AND utilisateur_id = $4
      RETURNING *
    `,
    [
      nom,
      type_categorie,
      id,
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Supprime une catégorie uniquement si elle appartient
  à l’utilisateur authentifié.
*/
export const deleteCategorie = async (
  id,
  utilisateurId
) => {
  const result = await pool.query(
    `
      DELETE FROM categorie
      WHERE id = $1
        AND utilisateur_id = $2
      RETURNING *
    `,
    [
      id,
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}