// ============================================================
// COMPOSANT PRINCIPAL FINANCEPILOT
// ============================================================
//
// Rôle : coordonner l'authentification, les comptes,
// les catégories et les messages de l'application.
//
// App.jsx appelle les services API puis transmet les données
// et les fonctions nécessaires aux composants spécialisés.

import { useEffect, useState } from "react"

import AuthForm from "./components/AuthForm.jsx"
import CompteForm from "./components/CompteForm.jsx"
import CompteList from "./components/CompteList.jsx"

// 🟨 NOUVEAU
import CategorieForm from "./components/CategorieForm.jsx"
import CategorieList from "./components/CategorieList.jsx"

import {
  connecterUtilisateur,
  inscrireUtilisateur,
  recupererUtilisateurConnecte,
} from "./services/auth.service.js"

import {
  creerCompte,
  modifierCompte,
  recupererComptes,
  supprimerCompte,
} from "./services/compte.service.js"

// 🟨 NOUVEAU
import {
  creerCategorie,
  modifierCategorie,
  recupererCategories,
  supprimerCategorie,
} from "./services/categorie.service.js"

function App() {
  // ==========================================================
  // ÉTAT GÉNÉRAL DE L'APPLICATION
  // ==========================================================

  const [utilisateur, setUtilisateur] = useState(null)
  const [comptes, setComptes] = useState([])
  const [message, setMessage] = useState("")
  const [compteEnModification, setCompteEnModification] =
    useState(null)

  // 🟨 NOUVEAU
  const [categories, setCategories] = useState([])
  const [categorieEnModification, setCategorieEnModification] =
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
          // Le token n'est plus valide.
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
  // CHARGEMENT DES CATÉGORIES APRÈS CONNEXION
  // ==========================================================

  // 🟨 NOUVEAU
  useEffect(() => {
    async function chargerCategories() {
      const token = localStorage.getItem("token")

      if (!utilisateur || !token) {
        return
      }

      try {
        const resultat = await recupererCategories(token)

        if (resultat.ok) {
          setCategories(resultat.donnees)
        } else {
          setCategories([])
          setMessage(resultat.donnees.message)
        }
      } catch {
        setCategories([])
        setMessage("Impossible de récupérer les catégories.")
      }
    }

    chargerCategories()
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
      // 🟨 NOUVEAU
      setCategories([])

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

    // 🟨 NOUVEAU
    setCategories([])
    setCategorieEnModification(null)

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
          resultat.donnees,
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
  // ACTIONS CRUD DES CATÉGORIES
  // ==========================================================

  // 🟨 NOUVEAU
  async function gererCreationCategorie(donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await creerCategorie(
        donneesFormulaire,
        token
      )

      if (resultat.ok) {
        setCategories((categoriesActuelles) => [
          ...categoriesActuelles,
          resultat.donnees,
        ])
        setMessage("Catégorie créée.")

        return true
      }

      setMessage(resultat.donnees.message)

      return false
    } catch {
      setMessage("Impossible de créer la catégorie.")

      return false
    }
  }

  // 🟨 NOUVEAU
  async function gererModificationCategorie(
    categorieId,
    donneesFormulaire
  ) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await modifierCategorie(
        categorieId,
        donneesFormulaire,
        token
      )

      if (resultat.ok) {
        setCategories((categoriesActuelles) =>
          categoriesActuelles.map((categorie) =>
            categorie.id === resultat.donnees.id
              ? resultat.donnees
              : categorie
          )
        )
        setCategorieEnModification(null)
        setMessage("Catégorie modifiée avec succès.")
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de modifier la catégorie.")
    }
  }

  // 🟨 NOUVEAU
  async function gererSuppressionCategorie(categorieId) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await supprimerCategorie(
        categorieId,
        token
      )

      if (resultat.ok) {
        setCategories((categoriesActuelles) =>
          categoriesActuelles.filter(
            (categorie) => categorie.id !== categorieId
          )
        )
        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer la catégorie.")
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

            {/* 🟨 NOUVEAU */}
            <h2>Créer une catégorie</h2>
            <CategorieForm
              onCreation={gererCreationCategorie}
            />

            {/* 🟨 NOUVEAU */}
            <h2>Mes catégories</h2>
            <CategorieList
              categories={categories}
              categorieEnModification={
                categorieEnModification
              }
              onDemarrerModification={
                setCategorieEnModification
              }
              onModification={gererModificationCategorie}
              onAnnulation={() =>
                setCategorieEnModification(null)
              }
              onSuppression={gererSuppressionCategorie}
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