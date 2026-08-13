// ============================================================
// CONTEXTE DE THÈME (CLAIR / SOMBRE)
// ============================================================
//
// Rôle : mémoriser le thème choisi, l'appliquer sur <html> via
// l'attribut data-theme, et exposer la fonction de bascule à
// toute l'application.
//
// Utilisé par : main.jsx (le fournisseur), et tout composant
// qui appelle useTheme() — notamment le bouton de la sidebar.
//
// Utilise : styles/tokens.css (qui réagit à data-theme)
//
// Pourquoi un contexte plutôt qu'un état dans App.jsx :
// le bouton de bascule peut se trouver n'importe où dans
// l'arborescence. Un contexte évite de faire transiter la
// fonction à travers tous les composants intermédiaires.

import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext(null)

const CLE_STOCKAGE = "financepilot-theme"

// Le thème est une préférence d'affichage, pas une donnée
// sensible : localStorage est ici légitime, contrairement au JWT.
function lireThemeInitial() {
  const themeEnregistre = localStorage.getItem(CLE_STOCKAGE)

  if (themeEnregistre === "clair" || themeEnregistre === "sombre") {
    return themeEnregistre
  }

  // À défaut, on suit la préférence système de macOS/Windows.
  const systemePrefereSombre = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches

  return systemePrefereSombre ? "sombre" : "clair"
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(lireThemeInitial)

  // Applique le thème sur <html> : tous les tokens CSS suivent.
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

// Raccourci d'accès au contexte, avec garde-fou explicite si
// un composant est utilisé hors du fournisseur.
export function useTheme() {
  const contexte = useContext(ThemeContext)

  if (!contexte) {
    throw new Error("useTheme doit être utilisé dans un ThemeProvider")
  }

  return contexte
}