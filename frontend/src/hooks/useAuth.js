// ============================================================
// HOOK D'AUTHENTIFICATION
// ============================================================
//
// Rôle : gérer la connexion, l'inscription, la déconnexion et
// la restauration de session au chargement de l'app.
//
// Expose aussi `message`/`setMessage`, car c'est l'état partagé
// utilisé par tous les autres hooks (comptes, catégories, etc.)
// pour afficher les retours de l'API.
//
// Utilisé par : App.jsx

import { useEffect, useState } from "react"

import {
  connecterUtilisateur,
  inscrireUtilisateur,
  recupererUtilisateurConnecte,
} from "../services/auth.service.js"

export function useAuth() {
  const [utilisateur, setUtilisateur] = useState(null)
  const [message, setMessage] = useState("")

  // Restaure la session si un token valide existe déjà.
  useEffect(() => {
    async function restaurerConnexion() {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      try {
        const resultat = await recupererUtilisateurConnecte(token)

        if (resultat.ok) {
          setUtilisateur(resultat.donnees[0])
        } else {
          localStorage.removeItem("token")
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
        localStorage.setItem("token", resultat.donnees.token)
        setUtilisateur(resultat.donnees.utilisateur)

        return true
      }

      localStorage.removeItem("token")
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

  function gererDeconnexion() {
    localStorage.removeItem("token")
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