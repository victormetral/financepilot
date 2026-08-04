/*
  SERVICE DES COMPTES

  Ce fichier exécute les requêtes SQL liées
  aux comptes bancaires.

  Utilisé par :
  - compte.controller.js

  Son rôle :
  - récupérer les comptes ;
  - créer un compte ;
  - modifier un compte ;
  - supprimer un compte.

  Règle de sécurité :
  - chaque recherche utilise utilisateur_id ;
  - un utilisateur ne peut accéder qu’à ses comptes ;
  - l’utilisateur_id provient du JWT via le contrôleur.

  Ce fichier ne doit pas :
  - utiliser request ou response ;
  - envoyer de statut HTTP ;
  - valider les données du body ;
  - vérifier directement le JWT.
*/

import { pool } from "../config/database.js"

/*
  Récupère uniquement les comptes appartenant
  à l’utilisateur authentifié.

  🟨 CORRIGÉ :
  La requête ne récupère plus tous les comptes
  présents dans la base de données.
*/
export const findAllComptes = async (
  utilisateurId
) => {
  // 🟨 CORRIGÉ : ajout du filtre utilisateur_id.
  const result = await pool.query(
    `
      SELECT *
      FROM compte
      WHERE utilisateur_id = $1
    `,
    [utilisateurId]
  )

  return result.rows
}

/*
  Crée un compte pour l’utilisateur authentifié.

  utilisateur_id a été ajouté par le contrôleur
  à partir du JWT avant l’appel de ce service.
*/
export const createCompte = async ({
  utilisateur_id,
  nom,
  type_compte,
  solde_initial,
  devise,
}) => {
  const result = await pool.query(
    `
      INSERT INTO compte (
        utilisateur_id,
        nom,
        type_compte,
        solde_initial,
        devise
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      utilisateur_id,
      nom,
      type_compte,
      solde_initial,
      devise,
    ]
  )

  return result.rows[0]
}

/*
  Recherche un compte grâce à deux conditions :

  - son identifiant ;
  - l’identifiant de son propriétaire.

  🟨 CORRIGÉ :
  connaître l’identifiant d’un compte ne suffit plus
  pour pouvoir le consulter.
*/
export const findCompteById = async (
  id,
  utilisateurId
) => {
  // 🟨 CORRIGÉ : ajout de utilisateur_id = $2.
  const result = await pool.query(
    `
      SELECT *
      FROM compte
      WHERE id = $1
        AND utilisateur_id = $2
    `,
    [
      id,
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Modifie un compte uniquement s’il appartient
  à l’utilisateur authentifié.

  utilisateur_id ne peut pas être modifié.
*/
export const updateCompte = async (
  id,
  utilisateurId,
  {
    nom,
    type_compte,
    solde_initial,
    devise,
  }
) => {
  const result = await pool.query(
    `
      UPDATE compte
      SET
        nom = $1,
        type_compte = $2,
        solde_initial = $3,
        devise = $4
      WHERE id = $5
        AND utilisateur_id = $6
      RETURNING *
    `,
    [
      nom,
      type_compte,
      solde_initial,
      devise,
      id,
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Supprime un compte uniquement s’il appartient
  à l’utilisateur authentifié.

  RETURNING renvoie le compte supprimé.
*/
export const deleteCompte = async (
  id,
  utilisateurId
) => {
  const result = await pool.query(
    `
      DELETE FROM compte
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