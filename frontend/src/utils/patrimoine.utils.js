// ============================================================
// CALCULS DE PATRIMOINE
// ============================================================
//
// Rôle : soldes des comptes, valorisation du portefeuille,
// patrimoine net.
//
// Fonctions pures : elles reçoivent les données déjà chargées
// par les hooks et renvoient des nombres.
//
// Utilisé par : hooks/useTableauDeBord.js
// Utilise : rien
//
// Limite assumée : les transferts sont exclus des calculs de
// solde. Le modèle ne stocke qu'un compte_id par transaction,
// donc un transfert n'a pas de compte de destination — le
// compter comme une sortie ferait baisser le patrimoine à
// tort. La colonne compte_destination_id reste à faire.

// ------------------------------------------------------------
// 1. SOLDES
// ------------------------------------------------------------

/*
  Calcule le solde réel d'un compte.

  Le backend ne stocke que solde_initial : le solde courant se
  recalcule à partir des transactions.

  Math.abs sur les dépenses : le signe du montant saisi n'est
  pas garanti, seul le type_transaction fait foi.
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

// ------------------------------------------------------------
// 2. PORTEFEUILLE
// ------------------------------------------------------------

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

// ------------------------------------------------------------
// 3. PATRIMOINE NET
// ------------------------------------------------------------

export function calculerPatrimoineNet(comptes, transactions, operations) {
  return (
    calculerTotalLiquidites(comptes, transactions) +
    calculerValeurPortefeuille(operations)
  )
}