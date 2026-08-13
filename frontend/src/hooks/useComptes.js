// ============================================================
// HOOK DES COMPTES BANCAIRES
// ============================================================
//
// Depuis Lot 5 : plus de vérification de token en local, le
// cookie httpOnly gère l'authentification. Une réponse 401
// du backend se traduit juste par resultat.ok === false.
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
      if (!utilisateur) {
        setComptes([])
        return
      }

      try {
        const resultat = await recupererComptes()

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
    try {
      const resultat = await creerCompte(donneesFormulaire)

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
    try {
      const resultat = await modifierCompte(compteId, donneesFormulaire)

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
    try {
      const resultat = await supprimerCompte(compteId)

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