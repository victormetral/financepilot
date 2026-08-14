import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES ACTIFS FINANCIERS
// ============================================================
//
// Rôle : centralise les appels HTTP vers l'API Actifs financiers.
//
// actif_financier est un référentiel global (partagé entre tous
// les utilisateurs) : la lecture est ouverte à tout utilisateur
// connecté, mais création/modification/suppression sont réservées
// aux administrateurs (vérifié côté backend par
// verifierAdministrateur).
//
// Utilisé par : hooks/useActifsFinanciers.js

async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees,
  }
}

export async function recupererActifsFinanciers() {
  const reponse = await fetch(`${API_URL}/actifs-financiers`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}

export async function creerActifFinancier({ symbole, nom, typeActif, devise }) {
  const reponse = await fetch(`${API_URL}/actifs-financiers`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbole,
      nom,
      type_actif: typeActif,
      devise,
    }),
  })

  return lireReponse(reponse)
}

export async function modifierActifFinancier(
  actifId,
  { symbole, nom, typeActif, devise }
) {
  const reponse = await fetch(`${API_URL}/actifs-financiers/${actifId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbole,
      nom,
      type_actif: typeActif,
      devise,
    }),
  })

  return lireReponse(reponse)
}

export async function supprimerActifFinancier(actifId) {
  const reponse = await fetch(`${API_URL}/actifs-financiers/${actifId}`, {
    method: "DELETE",
    credentials: "include",
  })

  return lireReponse(reponse)
}