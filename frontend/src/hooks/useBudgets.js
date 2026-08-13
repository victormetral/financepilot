// ============================================================
// HOOK DES BUDGETS
// ============================================================
//
// Depuis Lot 5 : plus de vérification de token en local, le
// cookie httpOnly gère l'authentification.
//
// Utilisé par : App.jsx

import { useEffect, useState } from "react"

import {
  creerBudget,
  modifierBudget,
  recupererBudgets,
  supprimerBudget,
} from "../services/budget.service.js"

export function useBudgets(utilisateur, setMessage) {
  const [budgets, setBudgets] = useState([])

  useEffect(() => {
    async function chargerBudgets() {
      if (!utilisateur) {
        setBudgets([])
        return
      }

      try {
        const resultat = await recupererBudgets()

        if (resultat.ok) {
          setBudgets(resultat.donnees.budgets)
        } else {
          setBudgets([])
          setMessage(resultat.donnees.message)
        }
      } catch {
        setBudgets([])
        setMessage("Impossible de récupérer les budgets.")
      }
    }

    chargerBudgets()
  }, [utilisateur, setMessage])

  async function gererCreationBudget(donneesFormulaire) {
    try {
      const resultat = await creerBudget(donneesFormulaire)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      const resultatListe = await recupererBudgets()

      if (resultatListe.ok) {
        setBudgets(resultatListe.donnees.budgets)
      }

      setMessage("Budget créé.")
      return true
    } catch {
      setMessage("Impossible de créer le budget.")
      return false
    }
  }

  async function gererModificationBudget(budgetId, donneesFormulaire) {
    try {
      const resultat = await modifierBudget(budgetId, donneesFormulaire)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      const resultatListe = await recupererBudgets()

      if (resultatListe.ok) {
        setBudgets(resultatListe.donnees.budgets)
      }

      setMessage("Budget modifié avec succès.")
      return true
    } catch {
      setMessage("Impossible de modifier le budget.")
      return false
    }
  }

  async function gererSuppressionBudget(budgetId) {
    try {
      const resultat = await supprimerBudget(budgetId)

      if (resultat.ok) {
        setBudgets((budgetsActuels) =>
          budgetsActuels.filter((budget) => budget.id !== budgetId)
        )

        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer le budget.")
    }
  }

  return {
    budgets,
    gererCreationBudget,
    gererModificationBudget,
    gererSuppressionBudget,
  }
}