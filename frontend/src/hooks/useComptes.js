// ============================================================
// HOOK DES COMPTES BANCAIRES
// ============================================================
//
// Rôle : charger, créer, modifier et supprimer les comptes de
// l'utilisateur connecté. Se recharge/se vide automatiquement
// quand `utilisateur` change (connexion/déconnexion).
//
// Utilisé par : App.jsx

import { useEffect, useState } from "react"

import {
  creerCompte,
  modifierCompte,
  recupererComptes,
  supprimerCompte,
} from "../services/compte.service.js"

export function useComptes(utilisateur, setMessage) {
  const [comptes, setComptes] = useState([])
  const [compteEnModification, setCompteEnModification] = useState(null)

  useEffect(() => {
    async function chargerComptes() {
      const token = localStorage.getItem("token")

      if (!utilisateur || !token) {
        setComptes([])
        return
      }

      try {
        const resultat = await recupererComptes(token)

        if (resultat.ok) {
          setComptes(resultat.donnees)
        } else {
          setComptes([])
          setMessage(resultat.donnees.message)
        }
      } catch {
        setComptes([])
        setMessage("Impossible de récupérer les comptes.")
      }
    }

    chargerComptes()
  }, [utilisateur, setMessage])

  async function gererCreationCompte(donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await creerCompte(donneesFormulaire, token)

      if (resultat.ok) {
        setComptes((comptesActuels) => [...comptesActuels, resultat.donnees])
        setMessage("Compte bancaire créé.")

        return true
      }

      setMessage(resultat.donnees.message)

      return false
    } catch {
      setMessage("Impossible de créer le compte bancaire.")

      return false
    }
  }

  async function gererModificationCompte(compteId, donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await modifierCompte(compteId, donneesFormulaire, token)

      if (resultat.ok) {
        setComptes((comptesActuels) =>
          comptesActuels.map((compte) =>
            compte.id === resultat.donnees.id ? resultat.donnees : compte
          )
        )

        setCompteEnModification(null)
        setMessage("Compte bancaire modifié avec succès.")
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de modifier le compte bancaire.")
    }
  }

  async function gererSuppressionCompte(compteId) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await supprimerCompte(compteId, token)

      if (resultat.ok) {
        setComptes((comptesActuels) =>
          comptesActuels.filter((compte) => compte.id !== compteId)
        )

        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer le compte bancaire.")
    }
  }

  return {
    comptes,
    compteEnModification,
    setCompteEnModification,
    gererCreationCompte,
    gererModificationCompte,
    gererSuppressionCompte,
  }
}