import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES BUDGETS
// ============================================================
//
// Depuis Lot 5 : `credentials: "include"` remplace le header
// Authorization — le cookie httpOnly part automatiquement.

async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees,
  }
}

export async function recupererBudgets() {
  const reponse = await fetch(`${API_URL}/budgets`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}

export async function creerBudget({ categorieId, montantLimite, mois, annee }) {
  const reponse = await fetch(`${API_URL}/budgets`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categorie_id: Number(categorieId),
      montant_limite: Number(montantLimite),
      mois: Number(mois),
      annee: Number(annee),
    }),
  })

  return lireReponse(reponse)
}

export async function modifierBudget(
  budgetId,
  { categorieId, montantLimite, mois, annee }
) {
  const reponse = await fetch(`${API_URL}/budgets/${budgetId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      categorie_id: Number(categorieId),
      montant_limite: Number(montantLimite),
      mois: Number(mois),
      annee: Number(annee),
    }),
  })

  return lireReponse(reponse)
}

export async function supprimerBudget(budgetId) {
  const reponse = await fetch(`${API_URL}/budgets/${budgetId}`, {
    method: "DELETE",
    credentials: "include",
  })

  return lireReponse(reponse)
}