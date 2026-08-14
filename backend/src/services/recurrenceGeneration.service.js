/*
  GÉNÉRATION DES OCCURRENCES

  Ce fichier transforme les modèles de récurrence en vraies
  transactions, puis avance leur curseur.

  Séparé de recurrence.service.js (qui fait le CRUD) pour
  deux raisons : garder les deux fichiers sous 200 lignes,
  et isoler la seule opération du projet qui a besoin d'une
  transaction SQL.

  Utilisé par :
  - recurrence.controller.js

  Utilise :
  - recurrence.utils.js (calcul pur des dates)
  - config/database.js (pool de connexions)
*/

import { pool } from "../config/database.js"
import { listerOccurrencesDues } from "../utils/recurrence.utils.js"

// ============================================================
// 1. DATE DU JOUR
// ============================================================

/*
  Renvoie la date du jour au format "AAAA-MM-JJ", en heure
  locale du serveur.

  toISOString() renverrait l'heure UTC : passé 22h à Paris en
  été, la date UTC est déjà celle du lendemain — le serveur
  générerait une occurrence un jour trop tôt. La construction
  manuelle évite ce piège, comme dans saisieExpress.utils.js
  côté frontend.
*/
const dateDuJour = () => {
  const maintenant = new Date()

  return [
    maintenant.getFullYear(),
    String(maintenant.getMonth() + 1).padStart(2, "0"),
    String(maintenant.getDate()).padStart(2, "0"),
  ].join("-")
}

// ============================================================
// 2. GÉNÉRATION
// ============================================================

/*
  Crée toutes les transactions dues pour l'utilisateur, puis
  avance le curseur de chaque récurrence traitée.

  Pourquoi une transaction SQL (BEGIN / COMMIT) :
  si l'insertion des transactions réussissait mais que la mise
  à jour du curseur échouait, l'appel suivant recréerait les
  mêmes transactions. Les deux opérations doivent réussir ou
  échouer ensemble.

  Pourquoi FOR UPDATE :
  ce verrou réserve les lignes lues jusqu'au COMMIT. Si deux
  onglets ouvrent l'application en même temps, le second
  attend la fin du premier et lit un curseur déjà avancé —
  au lieu de générer les mêmes transactions en double.

  Renvoie :
  { nombreCreees, transactions }
*/
export const genererOccurrencesDues = async (utilisateurId) => {
  const client = await pool.connect()
  const aujourdhui = dateDuJour()

  try {
    await client.query("BEGIN")

    /*
      Seules les récurrences actives, échues, et non terminées
      sont candidates. Le filtre sur compte.utilisateur_id
      garantit qu'on ne touche jamais aux modèles d'autrui.
    */
    const resultatRecurrences = await client.query(
      `
        SELECT recurrence.*
        FROM recurrence
        JOIN compte
          ON compte.id = recurrence.compte_id
        WHERE compte.utilisateur_id = $1
          AND recurrence.active = true
          AND recurrence.prochaine_occurrence <= $2::date
          AND (
            recurrence.date_fin IS NULL
            OR recurrence.prochaine_occurrence <= recurrence.date_fin
          )
        ORDER BY recurrence.id
        FOR UPDATE OF recurrence
      `,
      [utilisateurId, aujourdhui]
    )

    const transactionsCreees = []

    for (const recurrence of resultatRecurrences.rows) {
      const { occurrences, prochaineOccurrence } = listerOccurrencesDues(
        recurrence,
        aujourdhui
      )

      for (const dateOccurrence of occurrences) {
        /*
          recurrence_id relie la transaction à son modèle :
          il permet d'afficher un badge « récurrent » et de
          retrouver l'historique généré par une récurrence.
        */
        const resultatTransaction = await client.query(
          `
            INSERT INTO transaction_financiere (
              compte_id,
              categorie_id,
              libelle,
              montant,
              date_transaction,
              type_transaction,
              recurrence_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
          `,
          [
            recurrence.compte_id,
            recurrence.categorie_id,
            recurrence.libelle,
            recurrence.montant,
            dateOccurrence,
            recurrence.type_transaction,
            recurrence.id,
          ]
        )

        transactionsCreees.push(resultatTransaction.rows[0])
      }

      /*
        Le curseur avance même quand la date de fin est
        dépassée : la récurrence sort alors définitivement
        du filtre de la requête ci-dessus.
      */
      if (occurrences.length > 0) {
        await client.query(
          `
            UPDATE recurrence
            SET prochaine_occurrence = $1::date
            WHERE id = $2
          `,
          [prochaineOccurrence, recurrence.id]
        )
      }
    }

    await client.query("COMMIT")

    return {
      nombreCreees: transactionsCreees.length,
      transactions: transactionsCreees,
    }
  } catch (erreur) {
    /*
      ROLLBACK annule tout ce qui a été inséré depuis le
      BEGIN : la base revient à son état d'avant l'appel,
      et l'erreur remonte au contrôleur.
    */
    await client.query("ROLLBACK")
    throw erreur
  } finally {
    /*
      release() rend la connexion au pool. Sans lui, chaque
      appel en consommerait une définitivement et le serveur
      finirait par se figer, faute de connexion disponible.
    */
    client.release()
  }
}