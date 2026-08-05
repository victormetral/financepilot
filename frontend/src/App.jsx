// ============================================================
// COMPOSANT PRINCIPAL FINANCEPILOT
// ============================================================
//
// Rôle : coordonner l'utilisateur, les comptes et les messages.
//
// App.jsx ne contient plus le détail des formulaires ni des fetch.
// Il appelle les services et transmet des données aux composants.

import { useEffect, useState } from "react"

import AuthForm from "./components/AuthForm.jsx"
import CompteForm from "./components/CompteForm.jsx"
import CompteList from "./components/CompteList.jsx"

import {
  connecterUtilisateur,
  inscrireUtilisateur,
  recupererUtilisateurConnecte
} from "./services/auth.service.js"

import {
  creerCompte,
  modifierCompte,
  recupererComptes,
  supprimerCompte
} from "./services/compte.service.js"

function App() {
  // ==========================================================
  // ÉTAT GÉNÉRAL DE L'APPLICATION
  // ==========================================================

  const [utilisateur, setUtilisateur] = useState(null)
  const [comptes, setComptes] = useState([])
  const [message, setMessage] = useState("")
  const [compteEnModification, setCompteEnModification] =
    useState(null)

  // ==========================================================
  // RESTAURATION DE LA CONNEXION
  // ==========================================================

  useEffect(() => {
    async function restaurerConnexion() {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      try {
        const resultat =
          await recupererUtilisateurConnecte(token)

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

  // ==========================================================
  // CHARGEMENT DES COMPTES APRÈS CONNEXION
  // ==========================================================

  useEffect(() => {
    async function chargerComptes() {
      const token = localStorage.getItem("token")

      if (!utilisateur || !token) {
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
  }, [utilisateur])

  // ==========================================================
  // ACTIONS D'AUTHENTIFICATION
  // ==========================================================

  async function gererConnexion(email, motDePasse) {
    try {
      const resultat = await connecterUtilisateur(
        email,
        motDePasse
      )

      setMessage(resultat.donnees.message)

      if (resultat.ok) {
        localStorage.setItem("token", resultat.donnees.token)
        setUtilisateur(resultat.donnees.utilisateur)
        return true
      }

      localStorage.removeItem("token")
      setUtilisateur(null)
      setComptes([])
      return false
    } catch {
      setMessage("Impossible de contacter le serveur.")
      return false
    }
  }

  async function gererInscription(donneesFormulaire) {
    try {
      const resultat = await inscrireUtilisateur(
        donneesFormulaire
      )

      if (resultat.ok) {
        setMessage(
          "Compte créé. Vous pouvez vous connecter."
        )
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
    setComptes([])
    setCompteEnModification(null)
    setMessage("Déconnexion réussie")
  }

  // ==========================================================
  // ACTIONS CRUD DES COMPTES
  // ==========================================================

  async function gererCreationCompte(donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await creerCompte(
        donneesFormulaire,
        token
      )

      if (resultat.ok) {
        setComptes((comptesActuels) => [
          ...comptesActuels,
          resultat.donnees
        ])
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

  async function gererModificationCompte(
    compteId,
    donneesFormulaire
  ) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await modifierCompte(
        compteId,
        donneesFormulaire,
        token
      )

      if (resultat.ok) {
        setComptes((comptesActuels) =>
          comptesActuels.map((compte) =>
            compte.id === resultat.donnees.id
              ? resultat.donnees
              : compte
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
          comptesActuels.filter(
            (compte) => compte.id !== compteId
          )
        )
        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer le compte bancaire.")
    }
  }

  // ==========================================================
  // AFFICHAGE
  // ==========================================================

  return (
    <main>
      <h1>FinancePilot</h1>
      <p>Gérez vos finances simplement.</p>

      <section>
        {!utilisateur && (
          <AuthForm
            onConnexion={gererConnexion}
            onInscription={gererInscription}
          />
        )}

        {message && <p>{message}</p>}

        {utilisateur && (
          <div>
            <h2>Utilisateur connecté</h2>
            <p>Email : {utilisateur.email}</p>

            <h2>Créer un compte bancaire</h2>
            <CompteForm onCreation={gererCreationCompte} />

            <h2>Mes comptes</h2>
            <CompteList
              comptes={comptes}
              compteEnModification={compteEnModification}
              onDemarrerModification={
                setCompteEnModification
              }
              onModification={gererModificationCompte}
              onAnnulation={() =>
                setCompteEnModification(null)
              }
              onSuppression={gererSuppressionCompte}
            />

            <button type="button" onClick={gererDeconnexion}>
              Se déconnecter
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
