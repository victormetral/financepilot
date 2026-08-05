// ============================================================
// SERVICE D'AUTHENTIFICATION
// ============================================================
//
// Rôle : envoyer au backend les requêtes liées à l'utilisateur.
// Utilisé par : App.jsx.
//
// Un service ne gère pas l'affichage React.
// Il envoie une requête HTTP et renvoie la réponse à App.jsx.

import { API_URL } from "../config/api.js"

// 🟨 NOUVEAU : transforme la réponse HTTP en objet utilisable.
async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees
  }
}

export async function connecterUtilisateur(
  email,
  motDePasse
) {
  const reponse = await fetch(
    `${API_URL}/auth/connexion`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        mot_de_passe: motDePasse
      })
    }
  )

  return lireReponse(reponse)
}

export async function inscrireUtilisateur({
  nom,
  prenom,
  email,
  motDePasse
}) {
  const reponse = await fetch(`${API_URL}/utilisateurs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      nom,
      prenom,
      email,
      mot_de_passe: motDePasse
    })
  })

  return lireReponse(reponse)
}

export async function recupererUtilisateurConnecte(token) {
  const reponse = await fetch(`${API_URL}/utilisateurs`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return lireReponse(reponse)
}
