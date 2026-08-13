// ============================================================
// POINT D'ENTRÉE REACT
// ============================================================
//
// Rôle : monter l'application dans le DOM, charger les styles
// globaux dans l'ordre (tokens → layout → pages), et envelopper
// l'application dans le fournisseur de thème.
//
// Ordre des imports CSS important : tokens.css définit les
// variables utilisées par layout.css et page.css.
//
// Utilise : styles/tokens.css, styles/layout.css, styles/page.css,
// contexts/ThemeContext.jsx, App.jsx

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles/tokens.css"
import "./styles/layout.css"
import "./styles/page.css"
import "./styles/dashboard.css"
import { ThemeProvider } from "./contexts/ThemeContext.jsx"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
)