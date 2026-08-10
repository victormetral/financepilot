// ============================================================
// COMPOSANT PRINCIPAL FINANCEPILOT
// ============================================================
//
// Rôle : coordonner l'authentification, les comptes,
// les catégories, les budgets et les messages.
//
// App.jsx appelle les services API puis transmet les données
// et les fonctions aux composants spécialisés.

import { useEffect, useState } from "react"

import AuthForm from "./components/AuthForm.jsx"
import CompteForm from "./components/CompteForm.jsx"
import CompteList from "./components/CompteList.jsx"
import CategorieForm from "./components/CategorieForm.jsx"
import CategorieList from "./components/CategorieList.jsx"

// 🟨 NOUVEAU : composants Budget
import BudgetForm from "./components/BudgetForm.jsx"
import BudgetList from "./components/BudgetList.jsx"

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

import {
  creerCategorie,
  modifierCategorie,
  recupererCategories,
  supprimerCategorie,
} from "./services/categorie.service.js"

// 🟨 NOUVEAU : service API Budget
import {
  creerBudget,
  modifierBudget,
  recupererBudgets,
  supprimerBudget,
} from "./services/budget.service.js"

function App() {
  // ==========================================================
  // ÉTAT GÉNÉRAL DE L'APPLICATION
  // ==========================================================

  const [utilisateur, setUtilisateur] = useState(null)
  const [message, setMessage] = useState("")

  const [comptes, setComptes] = useState([])
  const [compteEnModification, setCompteEnModification] =
    useState(null)

  const [categories, setCategories] = useState([])
  const [categorieEnModification, setCategorieEnModification] =
    useState(null)

  // 🟨 NOUVEAU : liste des budgets reçus de l'API
  const [budgets, setBudgets] = useState([])

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
  // CHARGEMENT DES CATÉGORIES APRÈS CONNEXION
  // ==========================================================

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
  // CHARGEMENT DES BUDGETS APRÈS CONNEXION
  // ==========================================================

  // 🟨 NOUVEAU
  useEffect(() => {
    async function chargerBudgets() {
      const token = localStorage.getItem("token")

      if (!utilisateur || !token) {
        return
      }

      try {
        const resultat = await recupererBudgets(token)

        if (resultat.ok) {
          // GET /budgets renvoie { budgets, pagination }.
          setBudgets(resultat.donnees.budgets)
        } else {
          setBudgets([])
          setMessage(resultat.donnees.message)
        }
      } catch {
        setBudgets([])
        setMessage("Impossible de récupérer les budgets.")
      }
    }

    chargerBudgets()
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
      setCategories([])
      setBudgets([])

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
    setCategories([])
    setCategorieEnModification(null)

    // 🟨 NOUVEAU
    setBudgets([])

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
  // ACTIONS CRUD DES BUDGETS
  // ==========================================================

  // 🟨 NOUVEAU
  async function gererCreationBudget(donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await creerBudget(
        donneesFormulaire,
        token
      )

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      // Recharge la liste afin de récupérer nom_categorie.
      const resultatListe = await recupererBudgets(token)

      if (resultatListe.ok) {
        setBudgets(resultatListe.donnees.budgets)
      }

      setMessage("Budget créé.")

      return true
    } catch {
      setMessage("Impossible de créer le budget.")

      return false
    }
  }

  // 🟨 NOUVEAU
  async function gererModificationBudget(
    budgetId,
    donneesFormulaire
  ) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await modifierBudget(
        budgetId,
        donneesFormulaire,
        token
      )

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      // Recharge la liste afin de conserver nom_categorie.
      const resultatListe = await recupererBudgets(token)

      if (resultatListe.ok) {
        setBudgets(resultatListe.donnees.budgets)
      }

      setMessage("Budget modifié avec succès.")

      return true
    } catch {
      setMessage("Impossible de modifier le budget.")

      return false
    }
  }

  // 🟨 NOUVEAU
  async function gererSuppressionBudget(budgetId) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await supprimerBudget(
        budgetId,
        token
      )

      if (resultat.ok) {
        setBudgets((budgetsActuels) =>
          budgetsActuels.filter(
            (budget) => budget.id !== budgetId
          )
        )

        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer le budget.")
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

            <h2>Créer une catégorie</h2>
            <CategorieForm
              onCreation={gererCreationCategorie}
            />

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

            {/* 🟨 NOUVEAU : section Budget */}
            <h2>Créer un budget</h2>
            <BudgetForm
              categories={categories}
              onCreation={gererCreationBudget}
            />

            {/* 🟨 NOUVEAU : liste et modification */}
            <BudgetList
              budgets={budgets}
              categories={categories}
              onModification={gererModificationBudget}
              onSuppression={gererSuppressionBudget}
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