import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES OBJECTIFS
// ============================================================
//
// Rôle : centralise les appels HTTP vers l'API Objectifs.
// Le cookie httpOnly part automatiquement grâce à
// `credentials: "include"`.
//
// Utilisé par : hooks/useObjectifs.js

async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees,
  }
}

export async function recupererObjectifs() {
  const reponse = await fetch(`${API_URL}/objectifs`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}

export async function creerObjectif({
  nom,
  montantCible,
  montantActuel,
  dateEcheance,
  statut,
}) {
  const reponse = await fetch(`${API_URL}/objectifs`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nom,
      montant_cible: Number(montantCible),
      montant_actuel: Number(montantActuel ?? 0),
      date_echeance: dateEcheance || null,
      statut,
    }),
  })

  return lireReponse(reponse)
}

export async function modifierObjectif(
  objectifId,
  { nom, montantCible, montantActuel, dateEcheance, statut }
) {
  const reponse = await fetch(`${API_URL}/objectifs/${objectifId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nom,
      montant_cible: Number(montantCible),
      montant_actuel: Number(montantActuel),
      date_echeance: dateEcheance || null,
      statut,
    }),
  })

  return lireReponse(reponse)
}

export async function supprimerObjectif(objectifId) {
  const reponse = await fetch(`${API_URL}/objectifs/${objectifId}`, {
    method: "DELETE",
    credentials: "include",
  })

  return lireReponse(reponse)
}