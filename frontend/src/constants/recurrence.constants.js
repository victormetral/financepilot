// ============================================================
// CONSTANTES DES RÉCURRENCES
// ============================================================
//
// Rôle : libellés affichables des fréquences, et bornes de
// l'intervalle.
//
// Ces valeurs doivent rester alignées avec :
// - backend/src/constants/recurrence.constants.js
// - les contraintes CHECK de la migration 005
//
// Utilisé par :
// - components/RecurrenceForm.jsx
// - components/RecurrenceList.jsx

// ============================================================
// 1. FRÉQUENCES
// ============================================================

// L'ordre est celui du menu déroulant : le plus courant d'abord.
export const FREQUENCES = [
  { valeur: "mensuelle", libelle: "Tous les mois" },
  { valeur: "hebdomadaire", libelle: "Toutes les semaines" },
  { valeur: "trimestrielle", libelle: "Tous les trimestres" },
  { valeur: "annuelle", libelle: "Tous les ans" },
]

// ============================================================
// 2. AFFICHAGE DU RYTHME
// ============================================================

/*
  Décrit le rythme en une phrase lisible, en tenant compte de
  l'intervalle : "Tous les mois" mais "Tous les 3 mois".

  L'unité au singulier et au pluriel est stockée pour éviter
  d'écrire "Tous les 3 mois" à côté de "Tous les 2 semaine".
*/
const UNITES = {
  hebdomadaire: { singulier: "semaine", pluriel: "semaines" },
  mensuelle: { singulier: "mois", pluriel: "mois" },
  trimestrielle: { singulier: "trimestre", pluriel: "trimestres" },
  annuelle: { singulier: "an", pluriel: "ans" },
}

export const decrireRythme = (frequence, intervalle) => {
  const unite = UNITES[frequence]

  if (!unite) {
    return frequence
  }

  if (intervalle === 1) {
    return `Tous les ${unite.singulier}`
  }

  return `Tous les ${intervalle} ${unite.pluriel}`
}

// ============================================================
// 3. INTERVALLE
// ============================================================

// Alignées sur la contrainte CHECK recurrence_intervalle_valide.
export const INTERVALLE_MINIMUM = 1
export const INTERVALLE_MAXIMUM = 12