/*
  SERVICE DE LISTE DES TRANSACTIONS

  Contient uniquement findAllTransactions, isolée ici car
  elle construit dynamiquement des filtres SQL (compte,
  catégorie, type, dates, recherche texte) en plus de la
  pagination — trop volumineuse pour rester dans
  transaction.service.js.

  Utilisé par :
  - transaction.controller.js

  Règle de sécurité :
  la propriété est vérifiée via
  transaction_financiere.compte_id → compte.utilisateur_id.
*/

import { pool } from "../config/database.js"

/*
  Récupère uniquement les transactions appartenant
  à l'utilisateur authentifié, avec filtres optionnels
  et pagination.
*/
export const findAllTransactions = async (
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
  // Le premier paramètre SQL est toujours l'identifiant du JWT.
  const valeurs = [utilisateurId]

  const conditions = ["compte.utilisateur_id = $1"]

  if (compte_id) {
    valeurs.push(compte_id)
    conditions.push(`transaction_financiere.compte_id = $${valeurs.length}`)
  }

  if (categorie_id) {
    valeurs.push(categorie_id)
    conditions.push(`transaction_financiere.categorie_id = $${valeurs.length}`)
  }

  if (type_transaction) {
    valeurs.push(type_transaction)
    conditions.push(`transaction_financiere.type_transaction = $${valeurs.length}`)
  }

  if (date_debut) {
    valeurs.push(date_debut)
    conditions.push(`transaction_financiere.date_transaction >= $${valeurs.length}`)
  }

  if (date_fin) {
    valeurs.push(date_fin)
    conditions.push(`transaction_financiere.date_transaction <= $${valeurs.length}`)
  }

  if (recherche) {
    valeurs.push(`%${recherche}%`)
    conditions.push(`transaction_financiere.libelle ILIKE $${valeurs.length}`)
  }

  // Le filtre contient toujours au minimum compte.utilisateur_id = utilisateurId.
  const filtre = `WHERE ${conditions.join(" AND ")}`

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
      ORDER BY date_transaction DESC, transaction_financiere.id DESC
      LIMIT $${numeroLimite}
      OFFSET $${numeroOffset}
    `,
    valeurs
  )

  // Le comptage utilise aussi la table compte pour appliquer le filtre du propriétaire.
  const resultatTotal = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM transaction_financiere
      JOIN compte
        ON compte.id = transaction_financiere.compte_id
      ${filtre}
    `,
    valeursFiltres
  )

  return {
    transactions: resultatTransactions.rows,
    total: Number(resultatTotal.rows[0].total),
  }
}