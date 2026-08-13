// ============================================================
// INSTANCE DU CONTEXTE DE THÈME
// ============================================================
//
// Rôle : ce fichier ne fait qu'une chose — créer l'objet
// contexte. Séparé de ThemeContext.jsx (qui exporte le
// composant ThemeProvider) et de hooks/useTheme.js (qui exporte
// la fonction useTheme), car ESLint (react-refresh) interdit de
// mélanger plusieurs types d'export dans un même fichier.
//
// Utilisé par : contexts/ThemeContext.jsx, hooks/useTheme.js

import { createContext } from "react"

export const ThemeContext = createContext(null)