// ============================================================
// HOOK DES BUDGETS
// ============================================================
//
// Rôle : charger, créer, modifier et supprimer les budgets de
// l'utilisateur connecté. La liste est rechargée après chaque
// création/modification pour récupérer nom_categorie (jointure
// faite côté backend).
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
      const token = localStorage.getItem("token")

      if (!utilisateur || !token) {
        setBudgets([])
        return
      }

      try {
        const resultat = await recupererBudgets(token)

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
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await creerBudget(donneesFormulaire, token)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      const resultatListe = await recupererBudgets(token)

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
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await modifierBudget(budgetId, donneesFormulaire, token)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      const resultatListe = await recupererBudgets(token)

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
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await supprimerBudget(budgetId, token)

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