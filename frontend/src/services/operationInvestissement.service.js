import { API_URL } from "../config/api.js"

// ============================================================
// SERVICE DES OPÉRATIONS D'INVESTISSEMENT
// ============================================================
//
// Rôle : centralise les appels HTTP vers l'API Opérations
// d'investissement (achats et ventes d'actifs sur un compte).
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

export async function creerOperationInvestissement({
  compteId,
  actifFinancierId,
  typeOperation,
  quantite,
  prixUnitaire,
  frais,
  dateOperation,
}) {
  const reponse = await fetch(`${API_URL}/operations-investissement`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      compte_id: Number(compteId),
      actif_financier_id: Number(actifFinancierId),
      type_operation: typeOperation,
      quantite: Number(quantite),
      prix_unitaire: Number(prixUnitaire),
      frais: Number(frais ?? 0),
      date_operation: dateOperation,
    }),
  })

  return lireReponse(reponse)
}

export async function modifierOperationInvestissement(
  operationId,
  {
    compteId,
    actifFinancierId,
    typeOperation,
    quantite,
    prixUnitaire,
    frais,
    dateOperation,
  }
) {
  const reponse = await fetch(
    `${API_URL}/operations-investissement/${operationId}`,
    {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compte_id: Number(compteId),
        actif_financier_id: Number(actifFinancierId),
        type_operation: typeOperation,
        quantite: Number(quantite),
        prix_unitaire: Number(prixUnitaire),
        frais: Number(frais),
        date_operation: dateOperation,
      }),
    }
  )

  return lireReponse(reponse)
}

export async function supprimerOperationInvestissement(operationId) {
  const reponse = await fetch(
    `${API_URL}/operations-investissement/${operationId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  )

  return lireReponse(reponse)
}