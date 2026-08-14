// ============================================================
// HOOK DES OPÉRATIONS D'INVESTISSEMENT
// ============================================================
//
// Rôle : charger, créer, modifier et supprimer les opérations
// d'achat/vente d'actifs de l'utilisateur connecté.
//
// Les opérations alimentent aussi le calcul du patrimoine net
// sur le tableau de bord.
//
// Utilisé par : App.jsx (contexteRoutes → PageDashboard, PageInvestissements)

import { useEffect, useState } from "react"

import {
  creerOperationInvestissement,
  modifierOperationInvestissement,
  recupererOperationsInvestissement,
  supprimerOperationInvestissement,
} from "../services/operationInvestissement.service.js"

export function useOperationsInvestissement(utilisateur, setMessage) {
  const [operationsInvestissement, setOperationsInvestissement] = useState([])
  const [operationEnModification, setOperationEnModification] = useState(null)

  useEffect(() => {
    async function chargerOperations() {
      if (!utilisateur) {
        setOperationsInvestissement([])
        return
      }

      try {
        const resultat = await recupererOperationsInvestissement()

        if (resultat.ok) {
          setOperationsInvestissement(resultat.donnees)
        } else {
          setOperationsInvestissement([])
          setMessage(resultat.donnees.message)
        }
      } catch {
        setOperationsInvestissement([])
        setMessage("Impossible de récupérer les opérations d'investissement.")
      }
    }

    chargerOperations()
  }, [utilisateur, setMessage])

  // Après création/modification, la liste est rechargée pour
  // récupérer nom_compte et symbole_actif (jointures backend).
  async function rechargerOperations() {
    const resultat = await recupererOperationsInvestissement()

    if (resultat.ok) {
      setOperationsInvestissement(resultat.donnees)
    }
  }

  async function gererCreationOperation(donneesFormulaire) {
    try {
      const resultat = await creerOperationInvestissement(donneesFormulaire)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      await rechargerOperations()
      setMessage("Opération enregistrée.")
      return true
    } catch {
      setMessage("Impossible d'enregistrer l'opération.")
      return false
    }
  }

  async function gererModificationOperation(operationId, donneesFormulaire) {
    try {
      const resultat = await modifierOperationInvestissement(
        operationId,
        donneesFormulaire
      )

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      await rechargerOperations()
      setOperationEnModification(null)
      setMessage("Opération modifiée.")
      return true
    } catch {
      setMessage("Impossible de modifier l'opération.")
      return false
    }
  }

  async function gererSuppressionOperation(operationId) {
    try {
      const resultat = await supprimerOperationInvestissement(operationId)

      if (resultat.ok) {
        setOperationsInvestissement((operationsActuelles) =>
          operationsActuelles.filter((operation) => operation.id !== operationId)
        )

        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer l'opération.")
    }
  }

  return {
    operationsInvestissement,
    operationEnModification,
    setOperationEnModification,
    gererCreationOperation,
    gererModificationOperation,
    gererSuppressionOperation,
  }
}