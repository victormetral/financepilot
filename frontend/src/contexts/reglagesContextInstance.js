// ============================================================
// INSTANCE DU CONTEXTE DE RÉGLAGES
// ============================================================
//
// Rôle : ce fichier ne fait que créer l'objet contexte, isolé
// pour respecter la contrainte ESLint react-refresh (un fichier
// n'exporte qu'un seul type de chose).
//
// Utilisé par : contexts/ReglagesContext.jsx, hooks/useReglages.js

import { createContext } from "react"

export const ReglagesContext = createContext(null)