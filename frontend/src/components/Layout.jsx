// ============================================================
// MISE EN PAGE PROTÉGÉE (SIDEBAR + CONTENU)
// ============================================================
//
// Rôle : structure commune à toutes les pages une fois connecté
// — sidebar persistante à gauche, contenu de la route active à
// droite via <Outlet />.
//
// contexteRoutes est transmis aux pages via useOutletContext(),
// pour éviter de faire passer chaque donnée (comptes, budgets...)
// individuellement à travers chaque route.
//
// Utilisé par : App.jsx (uniquement quand utilisateur !== null)
// Utilise : Sidebar.jsx, styles/layout.css

import { Outlet } from "react-router-dom"
import Sidebar from "./Sidebar.jsx"

function Layout({ utilisateur, onDeconnexion, contexteRoutes }) {
  return (
    <div className="mise-en-page">
      <Sidebar utilisateur={utilisateur} onDeconnexion={onDeconnexion} />

      <main className="mise-en-page__contenu">
        <Outlet context={contexteRoutes} />
      </main>
    </div>
  )
}

export default Layout