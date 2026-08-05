// ============================================================
// SERVICE DES COMPTES BANCAIRES
// ============================================================
//
// Rôle : regrouper les quatre requêtes CRUD des comptes.
// Utilisé par : App.jsx.
//
// CRUD :
// Create = créer avec POST
// Read   = lire avec GET
// Update = modifier avec PUT
// Delete = supprimer avec DELETE

import { API_URL } from "../config/api.js"

async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees
  }
}

// 🟨 NOUVEAU : fabrique l'en-tête JWT commun aux routes protégées.
function creerHeaders(token, avecJson = false) {
  const headers = {
    Authorization: `Bearer ${token}`
  }

  if (avecJson) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

export async function recupererComptes(token) {
  const reponse = await fetch(`${API_URL}/comptes`, {
    headers: creerHeaders(token)
  })

  return lireReponse(reponse)
}

export async function creerCompte(
  { nom, typeCompte },
  token
) {
  const reponse = await fetch(`${API_URL}/comptes`, {
    method: "POST",
    headers: creerHeaders(token, true),
    body: JSON.stringify({
      nom,
      type_compte: typeCompte
    })
  })

  return lireReponse(reponse)
}

export async function modifierCompte(
  compteId,
  {
    nom,
    typeCompte,
    soldeInitial,
    devise
  },
  token
) {
  const reponse = await fetch(
    `${API_URL}/comptes/${compteId}`,
    {
      method: "PUT",
      headers: creerHeaders(token, true),
      body: JSON.stringify({
        nom,
        type_compte: typeCompte,
        solde_initial: Number(soldeInitial),
        devise
      })
    }
  )

  return lireReponse(reponse)
}

export async function supprimerCompte(compteId, token) {
  const reponse = await fetch(
    `${API_URL}/comptes/${compteId}`,
    {
      method: "DELETE",
      headers: creerHeaders(token)
    }
  )

  return lireReponse(reponse)
}
