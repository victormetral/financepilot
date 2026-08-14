// ============================================================
// HOOK DES OBJECTIFS
// ============================================================
//
// Rôle : charger, créer, modifier et supprimer les objectifs
// d'épargne de l'utilisateur connecté. Même pattern que
// useComptes / useCategories.
//
// Utilisé par : App.jsx (contexteRoutes → PageObjectifs)

import { useEffect, useState } from "react"

import {
  creerObjectif,
  modifierObjectif,
  recupererObjectifs,
  supprimerObjectif,
} from "../services/objectif.service.js"

export function useObjectifs(utilisateur, setMessage) {
  const [objectifs, setObjectifs] = useState([])
  const [objectifEnModification, setObjectifEnModification] = useState(null)

  useEffect(() => {
    async function chargerObjectifs() {
      if (!utilisateur) {
        setObjectifs([])
        return
      }

      try {
        const resultat = await recupererObjectifs()

        if (resultat.ok) {
          setObjectifs(resultat.donnees)
        } else {
          setObjectifs([])
          setMessage(resultat.donnees.message)
        }
      } catch {
        setObjectifs([])
        setMessage("Impossible de récupérer les objectifs.")
      }
    }

    chargerObjectifs()
  }, [utilisateur, setMessage])

  async function gererCreationObjectif(donneesFormulaire) {
    try {
      const resultat = await creerObjectif(donneesFormulaire)

      if (resultat.ok) {
        setObjectifs((objectifsActuels) => [...objectifsActuels, resultat.donnees])
        setMessage("Objectif créé.")
        return true
      }

      setMessage(resultat.donnees.message)
      return false
    } catch {
      setMessage("Impossible de créer l'objectif.")
      return false
    }
  }

  async function gererModificationObjectif(objectifId, donneesFormulaire) {
    try {
      const resultat = await modifierObjectif(objectifId, donneesFormulaire)

      if (resultat.ok) {
        setObjectifs((objectifsActuels) =>
          objectifsActuels.map((objectif) =>
            objectif.id === resultat.donnees.id ? resultat.donnees : objectif
          )
        )

        setObjectifEnModification(null)
        setMessage("Objectif modifié.")
        return true
      }

      setMessage(resultat.donnees.message)
      return false
    } catch {
      setMessage("Impossible de modifier l'objectif.")
      return false
    }
  }

  async function gererSuppressionObjectif(objectifId) {
    try {
      const resultat = await supprimerObjectif(objectifId)

      if (resultat.ok) {
        setObjectifs((objectifsActuels) =>
          objectifsActuels.filter((objectif) => objectif.id !== objectifId)
        )

        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer l'objectif.")
    }
  }

  return {
    objectifs,
    objectifEnModification,
    setObjectifEnModification,
    gererCreationObjectif,
    gererModificationObjectif,
    gererSuppressionObjectif,
  }
}