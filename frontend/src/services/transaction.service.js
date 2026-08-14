import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES TRANSACTIONS
// ============================================================
//
// Depuis Lot 5 : `credentials: "include"` remplace le header
// Authorization — le cookie httpOnly part automatiquement.
//
// Utilisé par : hooks/useTransactions.js

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
  Construit la chaîne de paramètres de l'URL à partir des
  filtres actifs.

  Les filtres vides sont écartés : envoyer `recherche=` ferait
  chercher une chaîne vide côté backend au lieu de ne pas
  filtrer du tout.

  URLSearchParams se charge de l'encodage — indispensable dès
  qu'un libellé contient un espace ou un accent.

  Exemple :
  { recherche: "carrefour", typeTransaction: "depense" }
  → "?recherche=carrefour&type_transaction=depense"
*/
function construireParametres(filtres = {}) {
  const parametres = new URLSearchParams()

  const correspondances = {
    recherche: filtres.recherche,
    compte_id: filtres.compteId,
    categorie_id: filtres.categorieId,
    type_transaction: filtres.typeTransaction,
    date_debut: filtres.dateDebut,
    date_fin: filtres.dateFin,
  }

  for (const [nom, valeur] of Object.entries(correspondances)) {
    if (valeur !== undefined && valeur !== null && valeur !== "") {
      parametres.append(nom, valeur)
    }
  }

  const chaine = parametres.toString()

  return chaine === "" ? "" : `?${chaine}`
}

// ============================================================
// 2. LECTURE
// ============================================================

/*
  Récupère les transactions, éventuellement filtrées.

  L'argument est facultatif : sans filtres, l'appel se comporte
  exactement comme avant, ce qui évite de toucher aux appels
  existants.
*/
export async function recupererTransactions(filtres) {
  const parametres = construireParametres(filtres)

  const reponse = await fetch(
    `${API_URL}/transactions${parametres}`,
    {
      credentials: "include",
    }
  )

  return lireReponse(reponse)
}

// ============================================================
// 3. ÉCRITURE
// ============================================================

export async function creerTransaction({
  compteId,
  categorieId,
  libelle,
  montant,
  dateTransaction,
  typeTransaction,
}) {
  const reponse = await fetch(`${API_URL}/transactions`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compte_id: Number(compteId),
      categorie_id: categorieId ? Number(categorieId) : null,
      libelle,
      montant: Number(montant),
      date_transaction: dateTransaction,
      type_transaction: typeTransaction,
    }),
  })

  return lireReponse(reponse)
}

export async function modifierTransaction(
  transactionId,
  { compteId, categorieId, libelle, montant, dateTransaction, typeTransaction }
) {
  const reponse = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compte_id: Number(compteId),
      categorie_id: categorieId ? Number(categorieId) : null,
      libelle,
      montant: Number(montant),
      date_transaction: dateTransaction,
      type_transaction: typeTransaction,
    }),
  })

  return lireReponse(reponse)
}

export async function supprimerTransaction(transactionId) {
  const reponse = await fetch(`${API_URL}/transactions/${transactionId}`, {
    method: "DELETE",
    credentials: "include",
  })

  return lireReponse(reponse)
}