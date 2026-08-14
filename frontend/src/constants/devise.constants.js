// ============================================================
// DEVISES AUTORISÉES (FRONTEND)
// ============================================================
//
// Rôle : alimenter les <select> de devise.
//
// Doit rester alignée avec backend/src/constants/devise.constants.js
// et avec la contrainte CHECK en base. Cette duplication est le
// coût du JavaScript sans typage partagé — TypeScript + Zod
// permettront un jour de n'avoir qu'une seule source.
//
// Utilisé par : CompteForm.jsx, CompteEditForm.jsx

export const DEVISES = [
  { code: "EUR", libelle: "Euro (€)" },
  { code: "USD", libelle: "Dollar américain ($)" },
  { code: "GBP", libelle: "Livre sterling (£)" },
  { code: "CHF", libelle: "Franc suisse (CHF)" },
  { code: "JPY", libelle: "Yen japonais (¥)" },
  { code: "CAD", libelle: "Dollar canadien (CA$)" },
  { code: "AUD", libelle: "Dollar australien (A$)" },
]

export const DEVISE_PAR_DEFAUT = "EUR"