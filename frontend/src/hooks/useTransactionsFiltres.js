// ============================================================
// HOOK DES FILTRES DE TRANSACTIONS
// ============================================================
//
// Rôle : détenir l'état des filtres de recherche et les deux
// gestes qui le modifient.
//
// Sorti de useTransactions.js : c'est le seul bloc du hook
// qui ne touche ni au réseau ni à la liste. Les autres
// opérations — créer, modifier, supprimer, dupliquer —
// partagent toutes le même geste (appeler le service puis
// recharger), et les séparer obligerait à faire circuler
// rechargerListe entre plusieurs fichiers pour un gain nul.
//
// Utilisé par : hooks/useTransactions.js
// Utilise : rien

import { useState } from "react"

/*
  Aucun filtre actif : l'état de départ, et la valeur de
  réinitialisation du bouton « Effacer les filtres ».

  Exporté pour que les tests et les composants puissent
  comparer à cette référence sans la recopier.
*/
export const FILTRES_VIDES = {
  recherche: "",
  compteId: "",
  categorieId: "",
  typeTransaction: "",
  dateDebut: "",
  dateFin: "",
}

export function useTransactionsFiltres() {
  const [filtres, setFiltres] = useState(FILTRES_VIDES)

  /*
    Modifie un seul filtre en conservant les autres.

    La forme fonctionnelle de setFiltres part toujours de la
    valeur la plus récente : deux changements rapprochés ne
    peuvent pas s'écraser l'un l'autre.

    Aucun bouton « Rechercher » n'est nécessaire — c'est
    useTransactions qui réagit au changement de filtres.
  */
  function gererChangementFiltre(nomFiltre, valeur) {
    setFiltres((filtresActuels) => ({
      ...filtresActuels,
      [nomFiltre]: valeur,
    }))
  }

  function gererReinitialisationFiltres() {
    setFiltres(FILTRES_VIDES)
  }

  return {
    filtres,
    gererChangementFiltre,
    gererReinitialisationFiltres,
  }
}