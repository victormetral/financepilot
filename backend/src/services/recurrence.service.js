/*
  SERVICE DES RÉCURRENCES (CRUD)

  Ce fichier exécute les requêtes SQL du CRUD des récurrences.
  La génération des occurrences vivra dans un fichier séparé
  (recurrenceGeneration.service.js, groupe 3) pour rester
  sous 200 lignes.

  Utilisé par :
  - recurrence.controller.js

  Règle de sécurité, identique aux transactions :
  - une récurrence appartient à l'utilisateur propriétaire
    de son compte ;
  - le propriétaire vient toujours du JWT ;
  - un compte ou une catégorie d'un autre utilisateur
    ne peut jamais être utilisé.
*/

import { pool } from "../config/database.js"

// ============================================================
// 1. LECTURE
// ============================================================

/*
  Liste les récurrences de l'utilisateur, la prochaine
  échéance en premier : c'est l'ordre utile à l'écran.

  Les récurrences en pause (active = false) n'ont plus
  d'échéance pertinente et sont renvoyées en dernier.
*/
export const findAllRecurrences = async (utilisateurId) => {
  const resultat = await pool.query(
    `
      SELECT
        recurrence.*,
        compte.nom AS nom_compte,
        categorie.nom AS nom_categorie
      FROM recurrence
      JOIN compte
        ON compte.id = recurrence.compte_id
      LEFT JOIN categorie
        ON categorie.id = recurrence.categorie_id
      WHERE compte.utilisateur_id = $1
      ORDER BY
        recurrence.active DESC,
        recurrence.prochaine_occurrence ASC,
        recurrence.id DESC
    `,
    [utilisateurId]
  )

  return resultat.rows
}

export const findRecurrenceById = async (id, utilisateurId) => {
  const resultat = await pool.query(
    `
      SELECT
        recurrence.*,
        compte.nom AS nom_compte,
        categorie.nom AS nom_categorie
      FROM recurrence
      JOIN compte
        ON compte.id = recurrence.compte_id
      LEFT JOIN categorie
        ON categorie.id = recurrence.categorie_id
      WHERE recurrence.id = $1
        AND compte.utilisateur_id = $2
    `,
    [id, utilisateurId]
  )

  return resultat.rows[0]
}

// ============================================================
// 2. CRÉATION
// ============================================================

/*
  INSERT ... SELECT plutôt qu'un INSERT direct : la ligne
  n'est écrite que si les deux vérifications de propriété
  réussissent. Sans résultat, le contrôleur renvoie 404.

  prochaine_occurrence est initialisée à date_debut : la
  première occurrence à créer est, par définition, la
  première de la série.
*/
export const createRecurrence = async (
  utilisateurId,
  {
    compte_id,
    categorie_id,
    libelle,
    montant,
    type_transaction,
    frequence,
    intervalle,
    date_debut,
    date_fin,
    active,
  }
) => {
  const resultat = await pool.query(
    `
      INSERT INTO recurrence (
        compte_id,
        categorie_id,
        libelle,
        montant,
        type_transaction,
        frequence,
        intervalle,
        date_debut,
        date_fin,
        prochaine_occurrence,
        active
      )
      SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $8, $10
      WHERE EXISTS (
        SELECT 1 FROM compte
        WHERE id = $1 AND utilisateur_id = $11
      )
      AND (
        $2::integer IS NULL
        OR EXISTS (
          SELECT 1 FROM categorie
          WHERE id = $2 AND utilisateur_id = $11
        )
      )
      RETURNING *
    `,
    [
      compte_id,
      categorie_id ?? null,
      libelle,
      montant,
      type_transaction,
      frequence,
      intervalle,
      date_debut,
      date_fin ?? null,
      active,
      utilisateurId,
    ]
  )

  return resultat.rows[0]
}

// ============================================================
// 3. MODIFICATION
// ============================================================

/*
  Trois vérifications, comme pour une transaction : la
  récurrence actuelle, le nouveau compte et la nouvelle
  catégorie doivent tous appartenir à l'utilisateur. Sans la
  deuxième, on pourrait déplacer sa récurrence vers le compte
  d'un autre.

  GREATEST sur prochaine_occurrence : si la nouvelle date de
  début est repoussée dans le futur, le curseur la suit ; si
  elle reste dans le passé, le curseur ne recule pas, sinon
  toutes les occurrences déjà générées seraient recréées.
*/
export const updateRecurrence = async (
  id,
  utilisateurId,
  {
    compte_id,
    categorie_id,
    libelle,
    montant,
    type_transaction,
    frequence,
    intervalle,
    date_debut,
    date_fin,
    active,
  }
) => {
  const resultat = await pool.query(
    `
      UPDATE recurrence
      SET
        compte_id = $1,
        categorie_id = $2,
        libelle = $3,
        montant = $4,
        type_transaction = $5,
        frequence = $6,
        intervalle = $7,
        date_debut = $8,
        date_fin = $9,
        prochaine_occurrence = GREATEST(prochaine_occurrence, $8::date),
        active = $10
      WHERE id = $11
        AND EXISTS (
          SELECT 1 FROM compte AS compte_actuel
          WHERE compte_actuel.id = recurrence.compte_id
            AND compte_actuel.utilisateur_id = $12
        )
        AND EXISTS (
          SELECT 1 FROM compte AS nouveau_compte
          WHERE nouveau_compte.id = $1
            AND nouveau_compte.utilisateur_id = $12
        )
        AND (
          $2::integer IS NULL
          OR EXISTS (
            SELECT 1 FROM categorie
            WHERE categorie.id = $2
              AND categorie.utilisateur_id = $12
          )
        )
      RETURNING *
    `,
    [
      compte_id,
      categorie_id ?? null,
      libelle,
      montant,
      type_transaction,
      frequence,
      intervalle,
      date_debut,
      date_fin ?? null,
      active,
      id,
      utilisateurId,
    ]
  )

  return resultat.rows[0]
}

// ============================================================
// 4. SUPPRESSION
// ============================================================

/*
  Aucune précaution particulière ici : la clé étrangère
  posée en migration 005 est ON DELETE SET NULL, donc les
  transactions déjà générées survivent et perdent seulement
  leur étiquette d'origine.
*/
export const deleteRecurrence = async (id, utilisateurId) => {
  const resultat = await pool.query(
    `
      DELETE FROM recurrence
      WHERE id = $1
        AND EXISTS (
          SELECT 1 FROM compte
          WHERE compte.id = recurrence.compte_id
            AND compte.utilisateur_id = $2
        )
      RETURNING *
    `,
    [id, utilisateurId]
  )

  return resultat.rows[0]
}