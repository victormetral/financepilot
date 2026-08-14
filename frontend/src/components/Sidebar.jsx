// ============================================================
// BARRE LATÉRALE DE NAVIGATION
// ============================================================
//
// Rôle : navigation principale entre les sections de l'app,
// affichage de l'utilisateur connecté, bascule de thème et
// déconnexion. Persistante sur toutes les pages protégées.
//
// L'ordre des liens suit le parcours logique d'utilisation :
// on crée d'abord ses comptes, puis ses catégories, avant de
// pouvoir saisir des transactions et fixer des budgets.
// Les récurrences suivent immédiatement les transactions :
// ce sont des transactions programmées à l'avance.
//
// Utilisé par : Layout.jsx
// Utilise : hooks/useTheme.js, react-router-dom

import { NavLink } from "react-router-dom"
import { useTheme } from "../hooks/useTheme.js"

const LIENS_NAVIGATION = [
  { chemin: "/", libelle: "Tableau de bord", icone: "◈" },
  { chemin: "/comptes", libelle: "Comptes", icone: "▤" },
  { chemin: "/categories", libelle: "Catégories", icone: "◫" },
  { chemin: "/transactions", libelle: "Transactions", icone: "≡" },
  { chemin: "/recurrences", libelle: "Récurrences", icone: "↻" },
  { chemin: "/budgets", libelle: "Budgets", icone: "◔" },
  { chemin: "/objectifs", libelle: "Objectifs", icone: "◎" },
  { chemin: "/investissements", libelle: "Investissements", icone: "▲" },
  { chemin: "/reglages", libelle: "Réglages", icone: "⚙" },
]

function Sidebar({ utilisateur, onDeconnexion }) {
  const { theme, basculerTheme } = useTheme()

  // Les initiales servent d'avatar tant qu'aucune photo de
  // profil n'existe côté backend.
  const initiales = utilisateur
    ? `${utilisateur.prenom?.[0] ?? ""}${utilisateur.nom?.[0] ?? ""}`.toUpperCase()
    : ""

  return (
    <aside className="sidebar">
      <div className="sidebar__marque">
        <span className="sidebar__logo">FP</span>
        <span className="sidebar__nom">FinancePilot</span>
      </div>

      <nav className="sidebar__navigation">
        {LIENS_NAVIGATION.map((lien) => (
          <NavLink
            key={lien.chemin}
            to={lien.chemin}
            end={lien.chemin === "/"}
            className={({ isActive }) =>
              isActive ? "sidebar__lien sidebar__lien--actif" : "sidebar__lien"
            }
          >
            <span className="sidebar__icone" aria-hidden="true">
              {lien.icone}
            </span>
            {lien.libelle}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__pied">
        <button
          type="button"
          className="sidebar__bouton-theme"
          onClick={basculerTheme}
          aria-label="Changer de thème"
        >
          <span aria-hidden="true">{theme === "clair" ? "☾" : "☀"}</span>
          {theme === "clair" ? "Thème sombre" : "Thème clair"}
        </button>

        <div className="sidebar__utilisateur">
          <span className="sidebar__avatar">{initiales}</span>
          <div className="sidebar__identite">
            <span className="sidebar__nom-utilisateur">
              {utilisateur?.prenom} {utilisateur?.nom}
            </span>
            <button
              type="button"
              className="sidebar__deconnexion"
              onClick={onDeconnexion}
            >
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar