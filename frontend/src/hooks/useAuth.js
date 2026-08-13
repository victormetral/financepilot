// ============================================================
// HOOK D'AUTHENTIFICATION
// ============================================================
//
// Depuis Lot 5 : plus de localStorage. La session est portée
// par le cookie httpOnly, envoyé automatiquement par le
// navigateur — la restauration de session consiste juste à
// appeler l'API et voir si elle répond 200 ou 401.
//
// Utilisé par : App.jsx

import { useEffect, useState } from "react"

import {
  connecterUtilisateur,
  deconnecterUtilisateur,
  inscrireUtilisateur,
  recupererUtilisateurConnecte,
} from "../services/auth.service.js"

export function useAuth() {
  const [utilisateur, setUtilisateur] = useState(null)
  const [message, setMessage] = useState("")

  useEffect(() => {
    async function restaurerConnexion() {
      try {
        const resultat = await recupererUtilisateurConnecte()

        if (resultat.ok) {
          setUtilisateur(resultat.donnees[0])
        }
      } catch {
        setMessage("Impossible de contacter le serveur.")
      }
    }

    restaurerConnexion()
  }, [])

  async function gererConnexion(email, motDePasse) {
    try {
      const resultat = await connecterUtilisateur(email, motDePasse)

      setMessage(resultat.donnees.message)

      if (resultat.ok) {
        setUtilisateur(resultat.donnees.utilisateur)
        return true
      }

      setUtilisateur(null)
      return false
    } catch {
      setMessage("Impossible de contacter le serveur.")
      return false
    }
  }

  async function gererInscription(donneesFormulaire) {
    try {
      const resultat = await inscrireUtilisateur(donneesFormulaire)

      if (resultat.ok) {
        setMessage("Compte créé. Vous pouvez vous connecter.")
        return true
      }

      setMessage(resultat.donnees.message)
      return false
    } catch {
      setMessage("Impossible de contacter le serveur.")
      return false
    }
  }

  async function gererDeconnexion() {
    try {
      await deconnecterUtilisateur()
    } catch {
      // Même si l'appel échoue, on déconnecte côté client.
    }

    setUtilisateur(null)
    setMessage("Déconnexion réussie")
  }

  return {
    utilisateur,
    message,
    setMessage,
    gererConnexion,
    gererInscription,
    gererDeconnexion,
  }
}