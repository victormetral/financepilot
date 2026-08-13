import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES CATÉGORIES
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

export async function recupererCategories() {
  const reponse = await fetch(`${API_URL}/categories`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}

export async function creerCategorie({ nom, typeCategorie }) {
  const reponse = await fetch(`${API_URL}/categories`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, type_categorie: typeCategorie }),
  })

  return lireReponse(reponse)
}

export async function modifierCategorie(categorieId, { nom, typeCategorie }) {
  const reponse = await fetch(`${API_URL}/categories/${categorieId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, type_categorie: typeCategorie }),
  })

  return lireReponse(reponse)
}

export async function supprimerCategorie(categorieId) {
  const reponse = await fetch(`${API_URL}/categories/${categorieId}`, {
    method: "DELETE",
    credentials: "include",
  })

  return lireReponse(reponse)
}