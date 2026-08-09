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

export async function recupererComptes(token) {
  const reponse = await fetch(`${API_URL}/comptes`, {
    headers: creerHeaders(token),
  })

  return lireReponse(reponse)
}

export async function creerCompte(
  { nom, typeCompte, sousTypeCompte },
  token
) {
  const reponse = await fetch(`${API_URL}/comptes`, {
    method: "POST",
    headers: creerHeaders(token, true),
    body: JSON.stringify({
      nom,
      type_compte: typeCompte,
      // 🟨 CORRIGÉ : champ exigé par le validateur backend.
      sous_type_compte: sousTypeCompte,
    }),
  })

  return lireReponse(reponse)
}

export async function modifierCompte(
  compteId,
  {
    nom,
    typeCompte,
    sousTypeCompte,
    soldeInitial,
    devise,
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
        // 🟨 CORRIGÉ : PUT exige aussi ce champ.
        sous_type_compte: sousTypeCompte,
        solde_initial: Number(soldeInitial),
        devise,
      }),
    }
  )

  return lireReponse(reponse)
}

export async function supprimerCompte(compteId, token) {
  const reponse = await fetch(
    `${API_URL}/comptes/${compteId}`,
    {
      method: "DELETE",
      headers: creerHeaders(token),
    }
  )

  return lireReponse(reponse)
}