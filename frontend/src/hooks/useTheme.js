// ============================================================
// HOOK D'ACCÈS AU THÈME
// ============================================================
//
// Rôle : raccourci de lecture du contexte de thème, avec
// garde-fou si utilisé hors du ThemeProvider.
//
// Utilisé par : Sidebar.jsx
// Utilise : contexts/themeContextInstance.js

import { useContext } from "react"
import { ThemeContext } from "../contexts/themeContextInstance.js"

export function useTheme() {
  const contexte = useContext(ThemeContext)

  if (!contexte) {
    throw new Error("useTheme doit être utilisé dans un ThemeProvider")
  }

  return contexte
}