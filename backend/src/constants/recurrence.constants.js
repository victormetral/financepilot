/*
  CONSTANTES DES RÉCURRENCES

  Ce fichier contient les listes fermées de valeurs
  acceptées par une récurrence.

  Utilisé par :
  - recurrence.validator.js

  Ces listes doivent rester alignées avec les contraintes
  CHECK de database/migrations/005_add_recurrences.sql.
  Si tu ajoutes une fréquence ici, ajoute-la aussi en base :
  sinon le validator laisse passer une valeur que PostgreSQL
  refusera, et l'utilisateur reçoit une erreur 500 illisible
  au lieu d'un message clair.
*/

// ============================================================
// 1. TYPES DE TRANSACTION GÉNÉRÉE
// ============================================================
//
// "transfert" est absent volontairement : il exige un compte
// de destination, colonne qui n'existe pas encore.

export const TYPES_RECURRENCE_AUTORISES = [
  "revenu",
  "depense",
]

// ============================================================
// 2. FRÉQUENCES
// ============================================================
//
// Le rythme réel est le produit de la fréquence et de
// l'intervalle : "mensuelle" avec un intervalle de 3 revient
// au même que "trimestrielle". Les deux notations coexistent
// parce que "trimestrielle" est plus parlant dans un menu
// déroulant.

export const FREQUENCES_AUTORISEES = [
  "hebdomadaire",
  "mensuelle",
  "trimestrielle",
  "annuelle",
]

// ============================================================
// 3. BORNES DE L'INTERVALLE
// ============================================================
//
// Un intervalle de 0 provoquerait une boucle infinie lors de
// la génération : la prochaine occurrence n'avancerait jamais.

export const INTERVALLE_MINIMUM = 1
export const INTERVALLE_MAXIMUM = 12