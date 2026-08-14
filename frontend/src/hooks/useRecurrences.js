// ============================================================
// HOOK DES RÉCURRENCES
// ============================================================
//
// Rôle : charger les modèles de transactions récurrentes,
// gérer leur création / modification / suppression, et
// déclencher la génération des occurrences dues à l'ouverture
// de l'application.
//
// Comme les autres hooks depuis le Lot 5 : aucune gestion de
// token en local, le cookie httpOnly s'en charge ; une réponse
// 401 se traduit simplement par resultat.ok === false.
//
// Utilisé par : App.jsx
// Utilise : services/recurrence.service.js

import { useCallback, useEffect, useRef, useState } from "react"

import {
  recupererRecurrences,
  creerRecurrence,
  modifierRecurrence,
  supprimerRecurrence,
  genererOccurrences,
} from "../services/recurrence.service.js"

/*
  onOccurrencesGenerees : appelé uniquement si des
  transactions ont réellement été créées, pour que la liste
  des transactions se recharge. Facultatif.
*/
export function useRecurrences(
  utilisateur,
  setMessage,
  onOccurrencesGenerees
) {
  const [recurrences, setRecurrences] = useState([])
  const [recurrenceEnModification, setRecurrenceEnModification] =
    useState(null)

  /*
    Mémorise que la génération a déjà eu lieu pour cette
    session. Sans ce garde-fou, le double montage de React en
    développement (StrictMode) lancerait deux appels. Le
    backend les traite sans créer de doublon, mais autant ne
    pas provoquer le travail inutile.
  */
  const generationFaite = useRef(false)

  // ==========================================================
  // 1. CHARGEMENT
  // ==========================================================

  const chargerRecurrences = useCallback(async () => {
    try {
      const resultat = await recupererRecurrences()

      if (resultat.ok) {
        setRecurrences(resultat.donnees)
      } else {
        setRecurrences([])
        setMessage(resultat.donnees.message)
      }
    } catch {
      setRecurrences([])
      setMessage("Impossible de récupérer les récurrences.")
    }
  }, [setMessage])

  /*
    Le vidage de la liste passe par une fonction interne et non
    par le corps de l'effet : ESLint interdit tout setState
    synchrone dans un effet, parce qu'il provoque un second
    rendu immédiat. Les autres hooks du projet suivent la
    même forme.

    generationFaite est une référence et non un état : la
    modifier ne déclenche aucun rendu, elle peut donc rester
    dans le corps de l'effet.
  */
  useEffect(() => {
    if (!utilisateur) {
      generationFaite.current = false
    }

    async function synchroniser() {
      if (!utilisateur) {
        setRecurrences([])
        return
      }

      await chargerRecurrences()
    }

    synchroniser()
  }, [utilisateur, chargerRecurrences])

  // ==========================================================
  // 2. GÉNÉRATION AUTOMATIQUE
  // ==========================================================

  /*
    Remplace une tâche planifiée côté serveur : le rattrapage
    se déclenche à l'ouverture de l'application et couvre
    toutes les échéances manquées, même après plusieurs mois
    sans connexion.

    L'échec est silencieux : ne pas générer une occurrence
    n'empêche pas d'utiliser l'application, et une alerte à
    chaque ouverture serait plus gênante qu'utile. Le prochain
    chargement réessaiera.
  */
  useEffect(() => {
    if (!utilisateur || generationFaite.current) {
      return
    }

    generationFaite.current = true

    async function genererPuisRafraichir() {
      try {
        const resultat = await genererOccurrences()

        if (!resultat.ok || resultat.donnees.nombre_creees === 0) {
          return
        }

        setMessage(resultat.donnees.message)

        await chargerRecurrences()

        if (onOccurrencesGenerees) {
          onOccurrencesGenerees()
        }
      } catch {
        // Silencieux : voir le commentaire ci-dessus.
      }
    }

    genererPuisRafraichir()
  }, [utilisateur, setMessage, chargerRecurrences, onOccurrencesGenerees])

  // ==========================================================
  // 3. ACTIONS CRUD
  // ==========================================================

  /*
    La liste est rechargée après création plutôt que complétée
    à la main : le backend renvoie la récurrence sans
    nom_compte ni nom_categorie, qui viennent d'une jointure.
    L'ajouter telle quelle afficherait une ligne incomplète.
  */
  async function gererCreationRecurrence(donneesFormulaire) {
    try {
      const resultat = await creerRecurrence(donneesFormulaire)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      await chargerRecurrences()
      setMessage("Récurrence créée.")

      return true
    } catch {
      setMessage("Impossible de créer la récurrence.")
      return false
    }
  }

  async function gererModificationRecurrence(
    recurrenceId,
    donneesFormulaire
  ) {
    try {
      const resultat = await modifierRecurrence(
        recurrenceId,
        donneesFormulaire
      )

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      await chargerRecurrences()
      setRecurrenceEnModification(null)
      setMessage("Récurrence modifiée.")

      return true
    } catch {
      setMessage("Impossible de modifier la récurrence.")
      return false
    }
  }

  async function gererSuppressionRecurrence(recurrenceId) {
    try {
      const resultat = await supprimerRecurrence(recurrenceId)

      if (resultat.ok) {
        setRecurrences((recurrencesActuelles) =>
          recurrencesActuelles.filter(
            (recurrence) => recurrence.id !== recurrenceId
          )
        )
      }

      setMessage(resultat.donnees.message)
    } catch {
      setMessage("Impossible de supprimer la récurrence.")
    }
  }

  return {
    recurrences,
    recurrenceEnModification,
    setRecurrenceEnModification,
    gererCreationRecurrence,
    gererModificationRecurrence,
    gererSuppressionRecurrence,
  }
}