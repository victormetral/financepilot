/*
  SERVICE DES TRANSACTIONS

  Ce fichier exécute les requêtes SQL liées
  aux transactions.

  Utilisé par :
  - transaction.controller.js

  Règles de sécurité :
  - une transaction appartient à l’utilisateur
    propriétaire de son compte ;
  - le propriétaire est vérifié avec utilisateur_id
    provenant du JWT ;
  - un compte ou une catégorie appartenant à un autre
    utilisateur ne peut pas être utilisé.
*/

import { pool } from "../config/database.js"

/*
  Récupère uniquement les transactions
  appartenant à l’utilisateur authentifié.

  La propriété est vérifiée grâce à :
  transaction_financiere.compte_id
  → compte.utilisateur_id
*/
export const findAllTransactions = async (
  // 🟨 NOUVEAU
  utilisateurId,
  compte_id,
  categorie_id,
  type_transaction,
  date_debut,
  date_fin,
  recherche,
  limite,
  offset
) => {
  /*
    🟨 CORRIGÉ

    Le premier paramètre SQL est toujours
    l’identifiant provenant du JWT.
  */
  const valeurs = [utilisateurId]

  const conditions = [
    "compte.utilisateur_id = $1",
  ]

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

  /*
    🟨 CORRIGÉ

    Le filtre contient toujours au minimum
    compte.utilisateur_id = utilisateurId.
  */
  const filtre =
    `WHERE ${conditions.join(" AND ")}`

  const valeursFiltres = [...valeurs]

  valeurs.push(limite)

  const numeroLimite = valeurs.length

  valeurs.push(offset)

  const numeroOffset = valeurs.length

  const resultatTransactions =
    await pool.query(
      `
        SELECT
          transaction_financiere.*,
          compte.nom AS nom_compte,
          categorie.nom AS nom_categorie
        FROM transaction_financiere
        JOIN compte
          ON compte.id =
            transaction_financiere.compte_id
        LEFT JOIN categorie
          ON categorie.id =
            transaction_financiere.categorie_id
        ${filtre}
        ORDER BY
          date_transaction DESC,
          transaction_financiere.id DESC
        LIMIT $${numeroLimite}
        OFFSET $${numeroOffset}
      `,
      valeurs
    )

  /*
    🟨 CORRIGÉ

    Le comptage utilise également la table compte
    afin d’appliquer le filtre du propriétaire.
  */
  const resultatTotal = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM transaction_financiere
      JOIN compte
        ON compte.id =
          transaction_financiere.compte_id
      ${filtre}
    `,
    valeursFiltres
  )

  return {
    transactions:
      resultatTransactions.rows,

    total:
      Number(
        resultatTotal.rows[0].total
      ),
  }
}

/*
  Recherche une transaction uniquement si son compte
  appartient à l’utilisateur authentifié.
*/
export const findTransactionById = async (
  id,
  // 🟨 NOUVEAU
  utilisateurId
) => {
  const result = await pool.query(
    `
      SELECT
        transaction_financiere.*,
        compte.nom AS nom_compte,
        categorie.nom AS nom_categorie
      FROM transaction_financiere
      JOIN compte
        ON compte.id =
          transaction_financiere.compte_id
      LEFT JOIN categorie
        ON categorie.id =
          transaction_financiere.categorie_id
      WHERE transaction_financiere.id = $1
        AND compte.utilisateur_id = $2
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
  Crée une transaction uniquement si :

  - le compte appartient à l’utilisateur du JWT ;
  - la catégorie est absente ou appartient
    au même utilisateur.
*/
export const createTransaction = async (
  // 🟨 NOUVEAU
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
  /*
    🟨 CORRIGÉ

    INSERT ... SELECT permet d’insérer uniquement
    lorsque les vérifications de propriété réussissent.
  */
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
      SELECT
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
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
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Modifie une transaction uniquement si :

  - la transaction actuelle appartient à l’utilisateur ;
  - le nouveau compte lui appartient ;
  - la nouvelle catégorie lui appartient ou est null.

  Cela empêche également de voler une transaction
  en remplaçant son compte.
*/
export const updateTransaction = async (
  id,
  // 🟨 NOUVEAU
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
          WHERE compte_actuel.id =
            transaction_financiere.compte_id
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
      // 🟨 NOUVEAU
      utilisateurId,
    ]
  )

  return result.rows[0]
}

/*
  Supprime une transaction uniquement si son compte
  appartient à l’utilisateur authentifié.
*/
export const deleteTransaction = async (
  id,
  // 🟨 NOUVEAU
  utilisateurId
) => {
  const result = await pool.query(
    `
      DELETE FROM transaction_financiere
      WHERE id = $1
        AND EXISTS (
          SELECT 1
          FROM compte
          WHERE compte.id =
            transaction_financiere.compte_id
            AND compte.utilisateur_id = $2
        )
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