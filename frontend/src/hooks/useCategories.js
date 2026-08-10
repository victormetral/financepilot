// ============================================================
// HOOK DES CATÉGORIES
// ============================================================
//
// Rôle : charger, créer, modifier et supprimer les catégories
// de l'utilisateur connecté. Se recharge/se vide automatiquement
// quand `utilisateur` change (connexion/déconnexion).
//
// Utilisé par : App.jsx

import { useEffect, useState } from "react"

import {
  creerCategorie,
  modifierCategorie,
  recupererCategories,
  supprimerCategorie,
} from "../services/categorie.service.js"

export function useCategories(utilisateur, setMessage) {
  const [categories, setCategories] = useState([])
  const [categorieEnModification, setCategorieEnModification] = useState(null)

  useEffect(() => {
    async function chargerCategories() {
      const token = localStorage.getItem("token")

      if (!utilisateur || !token) {
        setCategories([])
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
  }, [utilisateur, setMessage])

  async function gererCreationCategorie(donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await creerCategorie(donneesFormulaire, token)

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

  async function gererModificationCategorie(categorieId, donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await modifierCategorie(categorieId, donneesFormulaire, token)

      if (resultat.ok) {
        setCategories((categoriesActuelles) =>
          categoriesActuelles.map((categorie) =>
            categorie.id === resultat.donnees.id ? resultat.donnees : categorie
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
      const resultat = await supprimerCategorie(categorieId, token)

      if (resultat.ok) {
        setCategories((categoriesActuelles) =>
          categoriesActuelles.filter((categorie) => categorie.id !== categorieId)
        )

        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer la catégorie.")
    }
  }

  return {
    categories,
    categorieEnModification,
    setCategorieEnModification,
    gererCreationCategorie,
    gererModificationCategorie,
    gererSuppressionCategorie,
  }
}