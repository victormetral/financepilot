import { API_URL } from "../config/api.js"

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

export async function recupererCategories(token) {
  const reponse = await fetch(`${API_URL}/categories`, {
    headers: creerHeaders(token),
  })

  return lireReponse(reponse)
}

export async function creerCategorie(
  { nom, typeCategorie },
  token
) {
  const reponse = await fetch(`${API_URL}/categories`, {
    method: "POST",
    headers: creerHeaders(token, true),
    body: JSON.stringify({
      nom,
      type_categorie: typeCategorie,
    }),
  })

  return lireReponse(reponse)
}

export async function modifierCategorie(
  categorieId,
  { nom, typeCategorie },
  token
) {
  const reponse = await fetch(
    `${API_URL}/categories/${categorieId}`,
    {
      method: "PUT",
      headers: creerHeaders(token, true),
      body: JSON.stringify({
        nom,
        type_categorie: typeCategorie,
      }),
    }
  )

  return lireReponse(reponse)
}

export async function supprimerCategorie(categorieId, token) {
  const reponse = await fetch(
    `${API_URL}/categories/${categorieId}`,
    {
      method: "DELETE",
      headers: creerHeaders(token),
    }
  )

  return lireReponse(reponse)
}