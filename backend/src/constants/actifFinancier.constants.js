/*
  CONSTANTES DES ACTIFS FINANCIERS

  Ce fichier contient les types d’actifs acceptés
  par FinancePilot.

  Utilisé par :
  - actifFinancier.controller.js

  Victor :
  cette liste représente une règle métier.
  Elle peut évoluer si l’application gère de nouveaux
  types d’investissements.
*/

export const TYPES_ACTIF_AUTORISES = [
  "action",
  "etf",
  "crypto",
  "obligation",
  "fonds",
  "immobilier",
  "autre",
]

// Devise utilisée lorsqu’aucune devise n’est envoyée
export const DEVISE_PAR_DEFAUT = "EUR"