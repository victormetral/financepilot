/*
  SERVICE DES BUDGETS

  Ce fichier contient toutes les requêtes SQL liées
  aux budgets de FinancePilot.

  Utilisé par :
  - budget.controller.js

  Son rôle :
  - récupérer les budgets avec filtres et pagination ;
  - compter le nombre total de budgets ;
  - récupérer un budget par identifiant ;
  - créer un budget ;
  - modifier un budget ;
  - supprimer un budget.

  Répartition des responsabilités :

  budget.service.js
  → exécute les requêtes SQL

  budget.controller.js
  → gère les requêtes et réponses HTTP

  budget.validator.js
  → valide et transforme les données

  Règle importante :
  la colonne PostgreSQL s’appelle maintenant
  montant_limite.

  Victor :
  ne remets pas montant_maximum dans ce fichier,
  sinon le backend et la base ne correspondront plus.
*/

import { pool } from "../config/database.js"

/*
  Récupère les budgets avec des filtres facultatifs
  et une pagination.

  Filtres possibles :
  - utilisateur_id ;
  - categorie_id ;
  - mois ;
  - annee.

  Pagination :
  - limite : nombre maximal de résultats ;
  - offset : nombre de résultats ignorés.
*/
export const findAllBudgets = async (
  utilisateur_id,
  categorie_id,
  mois,
  annee,
  limite,
  offset
) => {
  /*
    valeurs contient les paramètres SQL.

    Exemple :
    [1, 7, 2026, 20, 0]

    L’utilisation de paramètres $1, $2, etc.
    protège les requêtes contre les injections SQL.
  */
  const valeurs = []

  /*
    conditions contient uniquement les filtres
    réellement présents dans la requête.
  */
  const conditions = []

  if (utilisateur_id !== undefined) {
    valeurs.push(utilisateur_id)

    conditions.push(
      `budget.utilisateur_id = $${valeurs.length}`
    )
  }

  if (categorie_id !== undefined) {
    valeurs.push(categorie_id)

    conditions.push(
      `budget.categorie_id = $${valeurs.length}`
    )
  }

  if (mois !== undefined) {
    valeurs.push(mois)

    conditions.push(
      `budget.mois = $${valeurs.length}`
    )
  }

  if (annee !== undefined) {
    valeurs.push(annee)

    conditions.push(
      `budget.annee = $${valeurs.length}`
    )
  }

  /*
    Si aucun filtre n’est fourni, filtre reste vide.

    Sinon, les conditions sont reliées par AND.

    Exemple :
    WHERE budget.utilisateur_id = $1
      AND budget.mois = $2
  */
  const filtre =
    conditions.length > 0
      ? `WHERE ${conditions.join(" AND ")}`
      : ""

  /*
    Le comptage total utilise uniquement
    les valeurs des filtres.

    limite et offset ne doivent pas être utilisés
    dans la requête COUNT.
  */
  const valeursFiltres = [...valeurs]

  /*
    Ajoute la limite à la fin des paramètres SQL.

    numeroLimite correspond au numéro du paramètre
    dans la requête PostgreSQL.
  */
  valeurs.push(limite)
  const numeroLimite = valeurs.length

  /*
    Ajoute ensuite l’offset.

    Exemple final :
    LIMIT $3
    OFFSET $4
  */
  valeurs.push(offset)
  const numeroOffset = valeurs.length

  /*
    Récupère les budgets de la page demandée.

    Le JOIN permet d’ajouter le nom de la catégorie
    sans effectuer une deuxième requête.
  */
  const resultatBudgets = await pool.query(
    `
      SELECT
        budget.*,
        categorie.nom AS nom_categorie
      FROM budget
      JOIN categorie
        ON categorie.id = budget.categorie_id
      ${filtre}
      ORDER BY
        budget.annee DESC,
        budget.mois DESC,
        budget.id DESC
      LIMIT $${numeroLimite}
      OFFSET $${numeroOffset}
    `,
    valeurs
  )

  /*
    Compte tous les budgets correspondant aux filtres,
    sans appliquer la pagination.

    Ce total permet au contrôleur de calculer
    le nombre total de pages.
  */
  const resultatTotal = await pool.query(
    `
      SELECT COUNT(*) AS total
      FROM budget
      ${filtre}
    `,
    valeursFiltres
  )

  return {
    budgets: resultatBudgets.rows,

    /*
      PostgreSQL renvoie COUNT sous forme de texte.

      Number() transforme par exemple :
      "12" en 12.
    */
    total: Number(
      resultatTotal.rows[0].total
    ),
  }
}

/*
  Récupère un budget précis grâce
  à son identifiant.

  Le nom de la catégorie est ajouté
  grâce au JOIN.
*/
export const findBudgetById = async (
  id
) => {
  const result = await pool.query(
    `
      SELECT
        budget.*,
        categorie.nom AS nom_categorie
      FROM budget
      JOIN categorie
        ON categorie.id = budget.categorie_id
      WHERE budget.id = $1
    `,
    [id]
  )

  /*
    rows[0] contient le premier résultat.

    Si aucun budget n’existe,
    la valeur renvoyée sera undefined.
  */
  return result.rows[0]
}

/*
  Crée un nouveau budget.

  🟨 CORRECTION :
  montant_maximum a été remplacé partout
  par montant_limite.
*/
export const createBudget = async ({
  utilisateur_id,
  categorie_id,
  montant_limite,
  mois,
  annee,
}) => {
  const result = await pool.query(
    `
      INSERT INTO budget (
        utilisateur_id,
        categorie_id,
        montant_limite,
        mois,
        annee
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [
      utilisateur_id,
      categorie_id,
      montant_limite,
      mois,
      annee,
    ]
  )

  return result.rows[0]
}

/*
  Modifie entièrement un budget existant.

  PUT transmet toutes les données principales
  du budget au service.

  🟨 CORRECTION :
  la propriété JavaScript et la colonne SQL
  utilisent toutes les deux montant_limite.
*/
export const updateBudget = async (
  id,
  {
    utilisateur_id,
    categorie_id,
    montant_limite,
    mois,
    annee,
  }
) => {
  const result = await pool.query(
    `
      UPDATE budget
      SET
        utilisateur_id = $1,
        categorie_id = $2,
        montant_limite = $3,
        mois = $4,
        annee = $5
      WHERE id = $6
      RETURNING *
    `,
    [
      utilisateur_id,
      categorie_id,
      montant_limite,
      mois,
      annee,
      id,
    ]
  )

  return result.rows[0]
}

/*
  Supprime un budget grâce à son identifiant.

  RETURNING * permet de renvoyer au contrôleur
  le budget qui vient d’être supprimé.
*/
export const deleteBudget = async (
  id
) => {
  const result = await pool.query(
    `
      DELETE FROM budget
      WHERE id = $1
      RETURNING *
    `,
    [id]
  )

  return result.rows[0]
}