// ============================================================
// HOOK DES ACTIFS FINANCIERS
// ============================================================
//
// Rôle : charger le référentiel d'actifs et permettre sa gestion
// aux administrateurs.
//
// La lecture est ouverte à tout utilisateur connecté ; la
// création/modification/suppression renvoie 403 si l'utilisateur
// n'est pas administrateur — le message d'erreur du backend
// suffit à l'expliquer, pas besoin de dupliquer la règle ici.
//
// Utilisé par : App.jsx (contexteRoutes → PageInvestissements)

import { useEffect, useState } from "react"

import {
  creerActifFinancier,
  modifierActifFinancier,
  recupererActifsFinanciers,
  supprimerActifFinancier,
} from "../services/actifFinancier.service.js"

export function useActifsFinanciers(utilisateur, setMessage) {
  const [actifsFinanciers, setActifsFinanciers] = useState([])
  const [actifEnModification, setActifEnModification] = useState(null)

  useEffect(() => {
    async function chargerActifs() {
      if (!utilisateur) {
        setActifsFinanciers([])
        return
      }

      try {
        const resultat = await recupererActifsFinanciers()

        if (resultat.ok) {
          setActifsFinanciers(resultat.donnees)
        } else {
          setActifsFinanciers([])
          setMessage(resultat.donnees.message)
        }
      } catch {
        setActifsFinanciers([])
        setMessage("Impossible de récupérer les actifs financiers.")
      }
    }

    chargerActifs()
  }, [utilisateur, setMessage])

  async function gererCreationActif(donneesFormulaire) {
    try {
      const resultat = await creerActifFinancier(donneesFormulaire)

      if (resultat.ok) {
        setActifsFinanciers((actifsActuels) => [...actifsActuels, resultat.donnees])
        setMessage("Actif financier créé.")
        return true
      }

      setMessage(resultat.donnees.message)
      return false
    } catch {
      setMessage("Impossible de créer l'actif financier.")
      return false
    }
  }

  async function gererModificationActif(actifId, donneesFormulaire) {
    try {
      const resultat = await modifierActifFinancier(actifId, donneesFormulaire)

      if (resultat.ok) {
        setActifsFinanciers((actifsActuels) =>
          actifsActuels.map((actif) =>
            actif.id === resultat.donnees.id ? resultat.donnees : actif
          )
        )

        setActifEnModification(null)
        setMessage("Actif financier modifié.")
        return true
      }

      setMessage(resultat.donnees.message)
      return false
    } catch {
      setMessage("Impossible de modifier l'actif financier.")
      return false
    }
  }

  async function gererSuppressionActif(actifId) {
    try {
      const resultat = await supprimerActifFinancier(actifId)

      if (resultat.ok) {
        setActifsFinanciers((actifsActuels) =>
          actifsActuels.filter((actif) => actif.id !== actifId)
        )

        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer l'actif financier.")
    }
  }

  return {
    actifsFinanciers,
    actifEnModification,
    setActifEnModification,
    gererCreationActif,
    gererModificationActif,
    gererSuppressionActif,
  }
}