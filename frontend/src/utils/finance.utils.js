// ============================================================
// CALCULS FINANCIERS
// ============================================================
//
// Rôle : centralise tous les calculs du tableau de bord —
// soldes, patrimoine, flux mensuels, reste-à-vivre, coût
// d'opportunité.
//
// Fonctions pures : aucune dépendance à React ni à l'API. Elles
// reçoivent les données déjà chargées par les hooks et renvoient
// des nombres. C'est le seul endroit du projet où vit la logique
// financière.
//
// Utilisé par : hooks/useTableauDeBord.js
// Utilise : rien
//
// Limite assumée : les transferts sont exclus des calculs de
// solde. Le modèle actuel ne stocke qu'un compte_id par
// transaction, donc un transfert n'a pas de compte destination
// — le compter comme une sortie ferait baisser le patrimoine à
// tort. Migration prévue au Lot 8.

// ------------------------------------------------------------
// 1. OUTILS DE DATE
// ------------------------------------------------------------

// PostgreSQL renvoie les dates en ISO complet (2026-08-31T22:00:00.000Z).
// On ne garde que la partie date pour éviter les décalages de fuseau.
export function extraireDate(dateIso) {
  return String(dateIso).split("T")[0]
}

export function estDansLeMois(dateIso, mois, annee) {
  const [anneeTransaction, moisTransaction] = extraireDate(dateIso).split("-")

  return Number(anneeTransaction) === annee && Number(moisTransaction) === mois
}

export function joursDansLeMois(mois, annee) {
  // Le jour 0 du mois suivant = dernier jour du mois courant.
  return new Date(annee, mois, 0).getDate()
}

export function joursRestantsDansLeMois(dateReference = new Date()) {
  const mois = dateReference.getMonth() + 1
  const annee = dateReference.getFullYear()

  return joursDansLeMois(mois, annee) - dateReference.getDate() + 1
}

// ------------------------------------------------------------
// 2. SOLDES ET PATRIMOINE
// ------------------------------------------------------------

/*
  Calcule le solde réel d'un compte.

  Le backend ne stocke que solde_initial : le solde courant doit
  être recalculé à partir des transactions. Les transferts sont
  ignorés (voir limite en en-tête de fichier).
*/
export function calculerSoldeCompte(compte, transactions) {
  const transactionsDuCompte = transactions.filter(
    (transaction) => transaction.compte_id === compte.id
  )

  const mouvements = transactionsDuCompte.reduce((total, transaction) => {
    const montant = Number(transaction.montant)

    if (transaction.type_transaction === "revenu") {
      return total + montant
    }

    if (transaction.type_transaction === "depense") {
      return total - Math.abs(montant)
    }

    return total
  }, 0)

  return Number(compte.solde_initial) + mouvements
}

export function calculerTotalLiquidites(comptes, transactions) {
  return comptes.reduce(
    (total, compte) => total + calculerSoldeCompte(compte, transactions),
    0
  )
}

/*
  Calcule le prix de revient unitaire (PRU) d'un actif, méthode
  du coût moyen pondéré — la norme fiscale française.

  Les frais d'achat sont intégrés au prix de revient ; les frais
  de vente réduisent le produit de cession mais ne modifient pas
  le PRU des titres restants.
*/
export function calculerPositionActif(operations) {
  let quantiteNette = 0
  let coutTotalAchats = 0
  let quantiteTotaleAchetee = 0

  for (const operation of operations) {
    const quantite = Number(operation.quantite)
    const prixUnitaire = Number(operation.prix_unitaire)
    const frais = Number(operation.frais ?? 0)

    if (operation.type_operation === "achat") {
      quantiteNette += quantite
      quantiteTotaleAchetee += quantite
      coutTotalAchats += quantite * prixUnitaire + frais
    }

    if (operation.type_operation === "vente") {
      quantiteNette -= quantite
    }
  }

  const pru =
    quantiteTotaleAchetee > 0 ? coutTotalAchats / quantiteTotaleAchetee : 0

  return {
    quantiteNette,
    pru,
    valeur: quantiteNette * pru,
  }
}

/*
  Valorise l'ensemble du portefeuille au prix de revient.

  Il ne s'agit PAS d'une valeur de marché : sans cours en temps
  réel, on ne peut afficher que ce qui a été investi. L'interface
  doit le dire explicitement pour ne pas induire en erreur.
*/
export function calculerValeurPortefeuille(operations) {
  const operationsParActif = new Map()

  for (const operation of operations) {
    const identifiant = operation.actif_financier_id
    const liste = operationsParActif.get(identifiant) ?? []

    liste.push(operation)
    operationsParActif.set(identifiant, liste)
  }

  let valeurTotale = 0

  for (const operationsActif of operationsParActif.values()) {
    valeurTotale += calculerPositionActif(operationsActif).valeur
  }

  return valeurTotale
}

export function calculerPatrimoineNet(comptes, transactions, operations) {
  return (
    calculerTotalLiquidites(comptes, transactions) +
    calculerValeurPortefeuille(operations)
  )
}

// ------------------------------------------------------------
// 3. FLUX DU MOIS
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
    tauxEpargne: entrees > 0 ? (epargne / entrees) * 100 : 0,
  }
}

// ------------------------------------------------------------
// 4. RESTE À VIVRE
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
// 5. COÛT D'OPPORTUNITÉ
// ------------------------------------------------------------

/*
  Valeur future d'un montant s'il avait été investi.

  Intérêts composés : montant × (1 + taux)^années.
  Défaut 7 % sur 20 ans — rendement nominal long terme
  défendable pour un ETF Monde (le rendement réel, après
  inflation, tourne plutôt autour de 5 %).
*/
export function calculerCoutOpportunite(montant, taux = 0.07, annees = 20) {
  return Math.abs(Number(montant)) * Math.pow(1 + taux, annees)
}

// ------------------------------------------------------------
// 6. FORMATAGE
// ------------------------------------------------------------

export function formaterMontant(montant, devise = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise,
    maximumFractionDigits: 2,
  }).format(Number(montant))
}

export function formaterPourcentage(valeur, decimales = 1) {
  return `${Number(valeur).toFixed(decimales)} %`
}

// ------------------------------------------------------------
// 7. PROJECTION D'OBJECTIFS
// ------------------------------------------------------------

/*
  Estime la date d'atteinte d'un objectif au rythme d'épargne
  mensuel constaté.

  Renvoie null quand la projection n'a pas de sens : objectif
  déjà atteint, ou épargne nulle/négative (à ce rythme, l'objectif
  ne sera jamais atteint — mieux vaut ne rien afficher que
  d'annoncer une date absurde).
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

/*
  Formate une date en "mars 2028" — plus lisible qu'une date
  précise pour une estimation qui reste approximative.
*/
export function formaterMoisAnnee(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(date)
}