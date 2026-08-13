import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES TRANSACTIONS
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

export async function recupererTransactions() {
  const reponse = await fetch(`${API_URL}/transactions`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}

export async function creerTransaction({
  compteId,
  categorieId,
  libelle,
  montant,
  dateTransaction,
  typeTransaction,
}) {
  const reponse = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
  { compteId, categorieId, libelle, montant, dateTransaction, typeTransaction }
) {
  const reponse = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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

export async function supprimerTransaction(transactionId) {
  const reponse = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: "DELETE",
    credentials: "include",
  })

  return lireReponse(reponse)
}