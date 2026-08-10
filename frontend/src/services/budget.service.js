import { API_URL } from "../config/api.js"

/*
  SERVICE DES BUDGETS

  Centralise les appels HTTP vers l'API Budget.
  Le token JWT est envoyé dans chaque requête protégée.
*/

async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees,
  }
}

function creerHeaders(token, avecJson = false) {
  const headers = {
    Authorization: `Bearer ${token}`,
  }

  if (avecJson) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

// Récupère la liste des budgets de l'utilisateur connecté.
export async function recupererBudgets(token) {
  const reponse = await fetch(`${API_URL}/budgets`, {
    headers: creerHeaders(token),
  })

  return lireReponse(reponse)
}

// Crée un budget pour une catégorie et une période données.
export async function creerBudget(
  { categorieId, montantLimite, mois, annee },
  token
) {
  const reponse = await fetch(`${API_URL}/budgets`, {
    method: "POST",
    headers: creerHeaders(token, true),
    body: JSON.stringify({
      categorie_id: Number(categorieId),
      montant_limite: Number(montantLimite),
      mois: Number(mois),
      annee: Number(annee),
    }),
  })

  return lireReponse(reponse)
}

// Modifie un budget existant.
export async function modifierBudget(
  budgetId,
  { categorieId, montantLimite, mois, annee },
  token
) {
  const reponse = await fetch(
    `${API_URL}/budgets/${budgetId}`,
    {
      method: "PUT",
      headers: creerHeaders(token, true),
      body: JSON.stringify({
        categorie_id: Number(categorieId),
        montant_limite: Number(montantLimite),
        mois: Number(mois),
        annee: Number(annee),
      }),
    }
  )

  return lireReponse(reponse)
}

// Supprime un budget appartenant à l'utilisateur connecté.
export async function supprimerBudget(budgetId, token) {
  const reponse = await fetch(
    `${API_URL}/budgets/${budgetId}`,
    {
      method: "DELETE",
      headers: creerHeaders(token),
    }
  )

  return lireReponse(reponse)
}