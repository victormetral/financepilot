// ============================================================
// SERVICE DES RÉCURRENCES
// ============================================================
//
// Rôle : envoyer au backend les requêtes liées aux modèles de
// transactions récurrentes, ainsi que la demande de génération
// des occurrences dues.
//
// `credentials: "include"` sur chaque requête : le cookie
// httpOnly ne part pas tout seul sans lui (Lot 5).
//
// Utilisé par : hooks/useRecurrences.js

import { API_URL } from "../config/api.js"

// ============================================================
// 1. OUTILS COMMUNS
// ============================================================

async function lireReponse(reponse) {
  const donnees = await reponse.json()

  return {
    ok: reponse.ok,
    donnees,
  }
}

/*
  Traduit les noms du formulaire (camelCase) vers ceux
  attendus par le backend (snake_case).

  Les champs facultatifs partent explicitement à null plutôt
  qu'absents : le backend distingue "non fourni" de "vidé", et
  une date de fin effacée doit bien effacer la valeur.
*/
function versCorpsBackend({
  compteId,
  categorieId,
  libelle,
  montant,
  typeTransaction,
  frequence,
  intervalle,
  dateDebut,
  dateFin,
  active,
}) {
  return {
    compte_id: Number(compteId),
    categorie_id: categorieId ? Number(categorieId) : null,
    libelle,
    montant: Number(montant),
    type_transaction: typeTransaction,
    frequence,
    intervalle: Number(intervalle) || 1,
    date_debut: dateDebut,
    date_fin: dateFin ? dateFin : null,
    active: active === undefined ? true : active,
  }
}

// ============================================================
// 2. LECTURE
// ============================================================

export async function recupererRecurrences() {
  const reponse = await fetch(`${API_URL}/recurrences`, {
    credentials: "include",
  })

  return lireReponse(reponse)
}

// ============================================================
// 3. ÉCRITURE
// ============================================================

export async function creerRecurrence(donnees) {
  const reponse = await fetch(`${API_URL}/recurrences`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(versCorpsBackend(donnees)),
  })

  return lireReponse(reponse)
}

export async function modifierRecurrence(recurrenceId, donnees) {
  const reponse = await fetch(`${API_URL}/recurrences/${recurrenceId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(versCorpsBackend(donnees)),
  })

  return lireReponse(reponse)
}

export async function supprimerRecurrence(recurrenceId) {
  const reponse = await fetch(`${API_URL}/recurrences/${recurrenceId}`, {
    method: "DELETE",
    credentials: "include",
  })

  return lireReponse(reponse)
}

// ============================================================
// 4. GÉNÉRATION
// ============================================================

/*
  Demande au backend de créer les transactions dues depuis le
  dernier appel.

  Aucun corps de requête : l'opération ne dépend que de
  l'utilisateur connecté et de la date du jour.

  La réponse contient nombre_creees, que le hook utilise pour
  n'afficher un message que si quelque chose a réellement été
  créé — l'appel réussit aussi quand il n'y a rien à faire,
  ce qui est le cas le plus fréquent.
*/
export async function genererOccurrences() {
  const reponse = await fetch(`${API_URL}/recurrences/generer`, {
    method: "POST",
    credentials: "include",
  })

  return lireReponse(reponse)
}