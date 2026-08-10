/*
  SERVICE DES TRANSACTIONS (CRUD)

  Contient la lecture unitaire, la création, la modification
  et la suppression d'une transaction.

  La liste avec filtres et pagination vit dans
  transactionListe.service.js (fonction trop volumineuse
  pour rester ici).

  Utilisé par :
  - transaction.controller.js

  Règles de sécurité :
  - une transaction appartient à l'utilisateur propriétaire
    de son compte ;
  - un compte ou une catégorie appartenant à un autre
    utilisateur ne peut pas être utilisé.
*/

import { pool } from "../config/database.js"

/*
  Recherche une transaction uniquement si son compte
  appartient à l'utilisateur authentifié.
*/
export const findTransactionById = async (id, utilisateurId) => {
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
        AND compte.utilisateur_id = $2
    `,
    [id, utilisateurId]
  )

  return result.rows[0]
}

/*
  Crée une transaction uniquement si :
  - le compte appartient à l'utilisateur du JWT ;
  - la catégorie est absente ou appartient au même utilisateur.

  INSERT ... SELECT permet d'insérer uniquement lorsque
  les vérifications de propriété réussissent.
*/
export const createTransaction = async (
  utilisateurId,
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
      INSERT INTO transaction_financiere (
        compte_id,
        categorie_id,
        libelle,
        montant,
        date_transaction,
        type_transaction
      )
      SELECT $1, $2, $3, $4, $5, $6
      WHERE EXISTS (
        SELECT 1
        FROM compte
        WHERE id = $1
          AND utilisateur_id = $7
      )
      AND (
        $2::integer IS NULL
        OR EXISTS (
          SELECT 1
          FROM categorie
          WHERE id = $2
            AND utilisateur_id = $7
        )
      )
      RETURNING *
    `,
    [
      compte_id,
      categorie_id ?? null,
      libelle,
      montant,
      date_transaction,
      type_transaction,
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Modifie une transaction uniquement si :
  - la transaction actuelle appartient à l'utilisateur ;
  - le nouveau compte lui appartient ;
  - la nouvelle catégorie lui appartient ou est null.

  Cela empêche aussi de voler une transaction en remplaçant
  son compte par celui d'un autre utilisateur.
*/
export const updateTransaction = async (
  id,
  utilisateurId,
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
        AND EXISTS (
          SELECT 1
          FROM compte AS compte_actuel
          WHERE compte_actuel.id = transaction_financiere.compte_id
            AND compte_actuel.utilisateur_id = $8
        )
        AND EXISTS (
          SELECT 1
          FROM compte AS nouveau_compte
          WHERE nouveau_compte.id = $1
            AND nouveau_compte.utilisateur_id = $8
        )
        AND (
          $2::integer IS NULL
          OR EXISTS (
            SELECT 1
            FROM categorie
            WHERE categorie.id = $2
              AND categorie.utilisateur_id = $8
          )
        )
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
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Supprime une transaction uniquement si son compte
  appartient à l'utilisateur authentifié.
*/
export const deleteTransaction = async (id, utilisateurId) => {
  const result = await pool.query(
    `
      DELETE FROM transaction_financiere
      WHERE id = $1
        AND EXISTS (
          SELECT 1
          FROM compte
          WHERE compte.id = transaction_financiere.compte_id
            AND compte.utilisateur_id = $2
        )
      RETURNING *
    `,
    [id, utilisateurId]
  )

  return result.rows[0]
}