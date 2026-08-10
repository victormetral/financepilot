import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES TRANSACTIONS
// ============================================================
//
// Rôle : centralise les appels HTTP vers l'API Transactions.
// Le token JWT est envoyé dans chaque requête protégée.
//
// Utilisé par : hooks/useTransactions.js

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

// Récupère les transactions de l'utilisateur connecté.
// Filtres optionnels, non exposés pour l'instant côté UI ;
// le backend applique ses valeurs par défaut si absents.
export async function recupererTransactions(token) {
  const reponse = await fetch(`${API_URL}/transactions`, {
    headers: creerHeaders(token),
  })

  return lireReponse(reponse)
}

export async function creerTransaction(
  { compteId, categorieId, libelle, montant, dateTransaction, typeTransaction },
  token
) {
  const reponse = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    headers: creerHeaders(token, true),
    body: JSON.stringify({
      compte_id: Number(compteId),
      categorie_id: categorieId ? Number(categorieId) : null,
      libelle,
      montant: Number(montant),
      date_transaction: dateTransaction,
      type_transaction: typeTransaction,
    }),
  })

  return lireReponse(reponse)
}

export async function modifierTransaction(
  transactionId,
  { compteId, categorieId, libelle, montant, dateTransaction, typeTransaction },
  token
) {
  const reponse = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: "PUT",
    headers: creerHeaders(token, true),
    body: JSON.stringify({
      compte_id: Number(compteId),
      categorie_id: categorieId ? Number(categorieId) : null,
      libelle,
      montant: Number(montant),
      date_transaction: dateTransaction,
      type_transaction: typeTransaction,
    }),
  })

  return lireReponse(reponse)
}

export async function supprimerTransaction(transactionId, token) {
  const reponse = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: "DELETE",
    headers: creerHeaders(token),
  })

  return lireReponse(reponse)
}