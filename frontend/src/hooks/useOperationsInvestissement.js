// ============================================================
// HOOK DES OPÉRATIONS D'INVESTISSEMENT (LECTURE SEULE)
// ============================================================
//
// Rôle : charge les opérations d'investissement de l'utilisateur
// connecté, nécessaires au calcul du patrimoine net. Se recharge
// automatiquement quand `utilisateur` change.
//
// Lecture seule pour l'instant — la création/modification vivra
// dans un hook complet au Lot 8, avec la page Investissements.
//
// Utilisé par : App.jsx (contexteRoutes → PageDashboard)

import { useEffect, useState } from "react"
import { recupererOperationsInvestissement } from "../services/operationInvestissement.service.js"

export function useOperationsInvestissement(utilisateur, setMessage) {
  const [operationsInvestissement, setOperationsInvestissement] = useState([])

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

  return { operationsInvestissement }
}