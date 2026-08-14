// ============================================================
// POINT D'ENTRÉE REACT
// ============================================================
//
// Rôle : monter l'application dans le DOM, charger les styles
// globaux dans l'ordre (tokens → layout → page → dashboard), et
// envelopper l'application dans ses fournisseurs de contexte.
//
// Ordre des imports CSS important : tokens.css définit les
// variables utilisées par tous les autres fichiers de style.
//
// Ordre des fournisseurs : ThemeProvider est le plus externe car
// il agit sur <html> ; ReglagesProvider ne concerne que le
// contenu de l'application.
//
// Utilise : styles/*, contexts/ThemeContext.jsx,
// contexts/ReglagesContext.jsx, App.jsx

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles/tokens.css"
import "./styles/layout.css"
import "./styles/page.css"
import "./styles/dashboard.css"

import { ThemeProvider } from "./contexts/ThemeContext.jsx"
import { ReglagesProvider } from "./contexts/ReglagesContext.jsx"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <ReglagesProvider>
        <App />
      </ReglagesProvider>
    </ThemeProvider>
  </StrictMode>
)