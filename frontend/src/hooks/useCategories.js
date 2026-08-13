// ============================================================
// HOOK DES CATÉGORIES
// ============================================================
//
// Depuis Lot 5 : plus de vérification de token en local, le
// cookie httpOnly gère l'authentification.
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
      if (!utilisateur) {
        setCategories([])
        return
      }

      try {
        const resultat = await recupererCategories()

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
    try {
      const resultat = await creerCategorie(donneesFormulaire)

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
    try {
      const resultat = await modifierCategorie(categorieId, donneesFormulaire)

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
    try {
      const resultat = await supprimerCategorie(categorieId)

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