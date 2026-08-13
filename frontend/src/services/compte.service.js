import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES COMPTES
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

export async function recupererComptes() {
  const reponse = await fetch(`${API_URL}/comptes`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}

export async function creerCompte({ nom, typeCompte, sousTypeCompte }) {
  const reponse = await fetch(`${API_URL}/comptes`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nom,
      type_compte: typeCompte,
      sous_type_compte: sousTypeCompte,
    }),
  })

  return lireReponse(reponse)
}

export async function modifierCompte(
  compteId,
  { nom, typeCompte, sousTypeCompte, soldeInitial, devise }
) {
  const reponse = await fetch(`${API_URL}/comptes/${compteId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nom,
      type_compte: typeCompte,
      sous_type_compte: sousTypeCompte,
      solde_initial: Number(soldeInitial),
      devise,
    }),
  })

  return lireReponse(reponse)
}

export async function supprimerCompte(compteId) {
  const reponse = await fetch(`${API_URL}/comptes/${compteId}`, {
    method: "DELETE",
    credentials: "include",
  })

  return lireReponse(reponse)
}