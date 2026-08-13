// ============================================================
// HOOK DU TABLEAU DE BORD
// ============================================================
//
// Rôle : assemble les données déjà chargées par les autres hooks
// (comptes, transactions, budgets, opérations d'investissement)
// et produit les indicateurs du dashboard via utils/finance.utils.js.
//
// Aucun appel API ici : ce hook ne fait que du calcul, sur des
// données déjà en mémoire — d'où useMemo plutôt qu'un nouvel effet.
//
// Les valeurs par défaut ([] pour chaque paramètre) protègent
// contre un rendu où le contexte de route n'a pas encore livré
// les données — ne devrait pas arriver avec l'état actuel des
// hooks, mais coûte rien et évite un plantage si un futur hook
// oublie d'initialiser son tableau.
//
// Utilisé par : pages/PageDashboard.jsx
// Utilise : utils/finance.utils.js

import { useMemo } from "react"

import {
  calculerTotalLiquidites,
  calculerValeurPortefeuille,
  calculerFluxDuMois,
  calculerResteAVivre,
} from "../utils/finance.utils.js"

export function useTableauDeBord(
  comptes = [],
  transactions = [],
  budgets = [],
  operationsInvestissement = []
) {
  const maintenant = new Date()
  const moisCourant = maintenant.getMonth() + 1
  const anneeCourante = maintenant.getFullYear()

  const liquidites = useMemo(
    () => calculerTotalLiquidites(comptes, transactions),
    [comptes, transactions]
  )

  const valeurPortefeuille = useMemo(
    () => calculerValeurPortefeuille(operationsInvestissement),
    [operationsInvestissement]
  )

  const patrimoineNet = liquidites + valeurPortefeuille

  const fluxDuMois = useMemo(
    () => calculerFluxDuMois(transactions, moisCourant, anneeCourante),
    [transactions, moisCourant, anneeCourante]
  )

  const resteAVivre = useMemo(
    () => calculerResteAVivre(budgets, transactions, moisCourant, anneeCourante),
    [budgets, transactions, moisCourant, anneeCourante]
  )

  const budgetsEnTension = useMemo(() => {
    const budgetsDuMois = budgets.filter(
      (budget) =>
        Number(budget.mois) === moisCourant &&
        Number(budget.annee) === anneeCourante
    )

    return budgetsDuMois
      .map((budget) => {
        const depensesCategorie = transactions
          .filter(
            (transaction) =>
              transaction.type_transaction === "depense" &&
              transaction.categorie_id === budget.categorie_id
          )
          .reduce(
            (total, transaction) => total + Math.abs(Number(transaction.montant)),
            0
          )

        const limite = Number(budget.montant_limite)

        return {
          ...budget,
          depense: depensesCategorie,
          proportion: limite > 0 ? depensesCategorie / limite : 0,
        }
      })
      .sort((a, b) => b.proportion - a.proportion)
      .slice(0, 5)
  }, [budgets, transactions, moisCourant, anneeCourante])

  // Aucune donnée du tout : sert à afficher un message d'accueil
  // plutôt que des cartes vides qui ne veulent rien dire.
  const aucuneDonnee =
    comptes.length === 0 &&
    transactions.length === 0 &&
    budgets.length === 0 &&
    operationsInvestissement.length === 0

  return {
    patrimoineNet,
    liquidites,
    valeurPortefeuille,
    fluxDuMois,
    resteAVivre,
    budgetsEnTension,
    aucuneDonnee,
    moisCourant,
    anneeCourante,
  }
}