/*
  DEVISES AUTORISÉES

  Liste fermée des devises acceptées par l'application.

  Utilisé par :
  - compte.validator.js
  - actifFinancier.validator.js

  Cette liste doit rester alignée avec la contrainte CHECK
  en base de données (migration 003) et avec le <select>
  du frontend. Trois endroits pour la même règle — c'est le
  coût du JavaScript sans typage partagé ; TypeScript + Zod
  permettront un jour de n'en avoir qu'un seul.
*/

export const DEVISES_AUTORISEES = [
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "JPY",
  "CAD",
  "AUD",
]

export const DEVISE_PAR_DEFAUT = "EUR"