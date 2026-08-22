// ============================================================
// CALCULS DE BUDGET ET DE PROJECTION
// ============================================================
//
// Rôle : flux mensuels, reste-à-vivre, coût d'opportunité,
// projection d'atteinte d'un objectif.
//
// Ce qui distingue ce fichier de patrimoine.utils.js : ici on
// raisonne sur une période — un mois, des années à venir —
// alors que le patrimoine est une photographie à l'instant t.
//
// Utilisé par : hooks/useTableauDeBord.js
// Utilise : date.utils.js

import {
  estDansLeMois,
  joursDansLeMois,
  joursRestantsDansLeMois,
} from "./date.utils.js"

// ------------------------------------------------------------
// 1. FLUX DU MOIS
// ------------------------------------------------------------

/*
  Entrées, sorties, épargne et taux d'épargne du mois.

  Le taux d'épargne (épargne / entrées) est l'indicateur clé du
  suivi financier long terme — absent de la plupart des apps
  grand public.
*/
export function calculerFluxDuMois(transactions, mois, annee) {
  const transactionsDuMois = transactions.filter((transaction) =>
    estDansLeMois(transaction.date_transaction, mois, annee)
  )

  const entrees = transactionsDuMois
    .filter((transaction) => transaction.type_transaction === "revenu")
    .reduce((total, transaction) => total + Number(transaction.montant), 0)

  const sorties = transactionsDuMois
    .filter((transaction) => transaction.type_transaction === "depense")
    .reduce(
      (total, transaction) => total + Math.abs(Number(transaction.montant)),
      0
    )

  const epargne = entrees - sorties

  return {
    entrees,
    sorties,
    epargne,
    // Sans entrée, la division serait impossible.
    tauxEpargne: entrees > 0 ? (epargne / entrees) * 100 : 0,
  }
}

// ------------------------------------------------------------
// 2. RESTE À VIVRE
// ------------------------------------------------------------

/*
  Calcule ce qu'il reste à dépenser sur les catégories budgétées.

  depensesHorsBudget est renvoyé séparément : sans lui, le
  chiffre mentirait par omission (une dépense sur une catégorie
  non budgétée disparaîtrait du suivi).

  rythme compare la consommation réelle à la consommation
  théorique à date :
  - 1.0  = pile dans les clous
  - >1.0 = tu dépenses plus vite que le budget ne le permet

  Limite connue : joursRestantsDansLeMois lit le mois de
  dateReference, alors que le reste de la fonction travaille sur
  les paramètres mois et annee. Tant que les deux coïncident,
  aucun écart. Le sélecteur de mois du Lot 10 les fera diverger
  et il faudra reprendre ce point.
*/
export function calculerResteAVivre(
  budgets,
  transactions,
  mois,
  annee,
  dateReference = new Date()
) {
  const budgetsDuMois = budgets.filter(
    (budget) => Number(budget.mois) === mois && Number(budget.annee) === annee
  )

  const categoriesBudgetees = new Set(
    budgetsDuMois.map((budget) => budget.categorie_id)
  )

  const budgete = budgetsDuMois.reduce(
    (total, budget) => total + Number(budget.montant_limite),
    0
  )

  const depensesDuMois = transactions.filter(
    (transaction) =>
      transaction.type_transaction === "depense" &&
      estDansLeMois(transaction.date_transaction, mois, annee)
  )

  const consomme = depensesDuMois
    .filter((transaction) => categoriesBudgetees.has(transaction.categorie_id))
    .reduce(
      (total, transaction) => total + Math.abs(Number(transaction.montant)),
      0
    )

  const depensesHorsBudget = depensesDuMois
    .filter((transaction) => !categoriesBudgetees.has(transaction.categorie_id))
    .reduce(
      (total, transaction) => total + Math.abs(Number(transaction.montant)),
      0
    )

  const reste = budgete - consomme
  const joursRestants = joursRestantsDansLeMois(dateReference)
  const totalJours = joursDansLeMois(mois, annee)
  const joursEcoules = totalJours - joursRestants + 1

  const consommationTheorique = (joursEcoules / totalJours) * budgete

  return {
    budgete,
    consomme,
    reste,
    depensesHorsBudget,
    joursRestants,
    parJour: joursRestants > 0 ? reste / joursRestants : 0,
    rythme: consommationTheorique > 0 ? consomme / consommationTheorique : 0,
  }
}

// ------------------------------------------------------------
// 3. COÛT D'OPPORTUNITÉ
// ------------------------------------------------------------

/*
  Valeur future d'un montant s'il avait été investi.

  Intérêts composés : montant × (1 + taux)^années.
  Défaut 7 % sur 20 ans — rendement nominal long terme
  défendable pour un ETF Monde (le rendement réel, après
  inflation, tourne plutôt autour de 5 %).

  Math.abs : une dépense est saisie en négatif, et un coût
  d'opportunité négatif n'aurait aucun sens.
*/
export function calculerCoutOpportunite(montant, taux = 0.07, annees = 20) {
  return Math.abs(Number(montant)) * Math.pow(1 + taux, annees)
}

// ------------------------------------------------------------
// 4. PROJECTION D'OBJECTIFS
// ------------------------------------------------------------

/*
  Estime la date d'atteinte d'un objectif au rythme d'épargne
  mensuel constaté.

  Renvoie null quand la projection n'a pas de sens : objectif
  déjà atteint, ou épargne nulle ou négative — à ce rythme
  l'objectif ne sera jamais atteint, et mieux vaut ne rien
  afficher qu'une date absurde.
*/
export function projeterAtteinteObjectif(
  montantActuel,
  montantCible,
  epargneMensuelle,
  dateReference = new Date()
) {
  const restant = Number(montantCible) - Number(montantActuel)

  if (restant <= 0) {
    return { atteint: true, dateEstimee: null, moisRestants: 0 }
  }

  if (epargneMensuelle <= 0) {
    return { atteint: false, dateEstimee: null, moisRestants: null }
  }

  const moisRestants = Math.ceil(restant / epargneMensuelle)

  const dateEstimee = new Date(dateReference)
  dateEstimee.setMonth(dateEstimee.getMonth() + moisRestants)

  return { atteint: false, dateEstimee, moisRestants }
}