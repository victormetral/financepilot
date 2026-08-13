// ============================================================
// HOOK D'AUTHENTIFICATION
// ============================================================
//
// Rôle : gérer la connexion, l'inscription, la déconnexion et
// la restauration de session au chargement de l'app.
//
// Expose aussi `message`/`setMessage`, car c'est l'état partagé
// utilisé par tous les autres hooks (comptes, catégories, etc.)
// pour afficher les retours de l'API. Le message s'efface tout
// seul après quelques secondes — sinon il reste affiché en
// changeant de page, ce qui n'a pas de sens une fois périmé.
//
// Utilisé par : App.jsx

import { useEffect, useRef, useState } from "react"

import {
  connecterUtilisateur,
  deconnecterUtilisateur,
  inscrireUtilisateur,
  recupererUtilisateurConnecte,
} from "../services/auth.service.js"

const DUREE_AFFICHAGE_MESSAGE_MS = 5000

export function useAuth() {
  const [utilisateur, setUtilisateur] = useState(null)
  const [message, setMessage] = useState("")

  // Permet d'annuler le minuteur précédent si un nouveau message
  // arrive avant l'expiration du premier.
  const minuteurMessage = useRef(null)

  useEffect(() => {
    if (minuteurMessage.current) {
      clearTimeout(minuteurMessage.current)
    }

    if (!message) {
      return
    }

    minuteurMessage.current = setTimeout(() => {
      setMessage("")
    }, DUREE_AFFICHAGE_MESSAGE_MS)

    return () => clearTimeout(minuteurMessage.current)
  }, [message])

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