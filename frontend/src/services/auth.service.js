// ============================================================
// SERVICE D'AUTHENTIFICATION
// ============================================================
//
// Rôle : envoyer au backend les requêtes liées à l'utilisateur.
// Depuis Lot 5, l'authentification passe par un cookie httpOnly :
// `credentials: "include"` est nécessaire sur chaque requête pour
// que le navigateur envoie/reçoive ce cookie.
//
// Utilisé par : hooks/useAuth.js

import { API_URL } from "../config/api.js"

async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees,
  }
}

export async function connecterUtilisateur(email, motDePasse) {
  const reponse = await fetch(`${API_URL}/auth/connexion`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, mot_de_passe: motDePasse }),
  })

  return lireReponse(reponse)
}

export async function inscrireUtilisateur({ nom, prenom, email, motDePasse }) {
  const reponse = await fetch(`${API_URL}/utilisateurs`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nom, prenom, email, mot_de_passe: motDePasse }),
  })

  return lireReponse(reponse)
}

// Le cookie part automatiquement avec la requête : plus besoin de token en argument.
export async function recupererUtilisateurConnecte() {
  const reponse = await fetch(`${API_URL}/utilisateurs`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}

// Le backend efface le cookie httpOnly : le JS ne peut pas le faire lui-même.
export async function deconnecterUtilisateur() {
  const reponse = await fetch(`${API_URL}/auth/deconnexion`, {
    method: "POST",
    credentials: "include",
  })

  return lireReponse(reponse)
}