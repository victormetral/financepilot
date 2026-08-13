import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES OPÉRATIONS D'INVESTISSEMENT
// ============================================================
//
// Rôle : récupère les opérations d'investissement de
// l'utilisateur connecté. Lecture seule pour l'instant — la
// création/modification/suppression sera ajoutée au Lot 8 avec
// l'interface complète de la page Investissements.
//
// Utilisé par : hooks/useOperationsInvestissement.js

async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees,
  }
}

export async function recupererOperationsInvestissement() {
  const reponse = await fetch(`${API_URL}/operations-investissement`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}