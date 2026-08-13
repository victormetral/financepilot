// ============================================================
// FOURNISSEUR DE THÈME (CLAIR / SOMBRE)
// ============================================================
//
// Rôle : mémoriser le thème choisi et l'appliquer sur <html>
// via l'attribut data-theme.
//
// N'exporte que le composant ThemeProvider — l'objet contexte
// vit dans themeContextInstance.js, et le hook de lecture dans
// hooks/useTheme.js (contrainte ESLint Fast Refresh : un fichier
// ne doit exporter qu'un seul type de chose).
//
// Utilisé par : main.jsx
// Utilise : contexts/themeContextInstance.js, styles/tokens.css

import { useEffect, useState } from "react"
import { ThemeContext } from "./themeContextInstance.js"

const CLE_STOCKAGE = "financepilot-theme"

function lireThemeInitial() {
  const themeEnregistre = localStorage.getItem(CLE_STOCKAGE)

  if (themeEnregistre === "clair" || themeEnregistre === "sombre") {
    return themeEnregistre
  }

  const systemePrefereSombre = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches

  return systemePrefereSombre ? "sombre" : "clair"
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(lireThemeInitial)

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem(CLE_STOCKAGE, theme)
  }, [theme])

  function basculerTheme() {
    setTheme((themeActuel) => (themeActuel === "clair" ? "sombre" : "clair"))
  }

  return (
    <ThemeContext.Provider value={{ theme, basculerTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}