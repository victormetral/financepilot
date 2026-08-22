// ============================================================
// BARRE LATÉRALE DE NAVIGATION
// ============================================================
//
// Rôle : navigation principale entre les sections de l'app,
// affichage de l'utilisateur connecté, bascule de thème et
// déconnexion. Persistante sur toutes les pages protégées.
//
// Les liens sont groupés par fréquence d'usage et non par
// ordre de création. L'ordre précédent — comptes, puis
// catégories, puis transactions — suivait le parcours du
// premier lancement : juste une fois, faux les cinq cents
// suivantes. Ce qu'on ouvre chaque semaine passe donc devant
// ce qu'on configure une fois.
//
// Utilisé par : Layout.jsx
// Utilise : hooks/useTheme.js, react-router-dom

import { NavLink } from "react-router-dom"
import { useTheme } from "../hooks/useTheme.js"

/*
  Un groupe sans titre reste sans en-tête à l'écran : le
  tableau de bord est le point d'entrée, le coiffer d'un
  intitulé n'apporterait rien.
*/
const GROUPES_NAVIGATION = [
  {
    titre: null,
    liens: [{ chemin: "/", libelle: "Tableau de bord", icone: "◈" }],
  },
  {
    titre: "Au quotidien",
    liens: [
      { chemin: "/transactions", libelle: "Transactions", icone: "≡" },
      { chemin: "/recurrences", libelle: "Récurrences", icone: "↻" },
      { chemin: "/budgets", libelle: "Budgets", icone: "◔" },
    ],
  },
  {
    titre: "Patrimoine",
    liens: [
      { chemin: "/comptes", libelle: "Comptes", icone: "▤" },
      { chemin: "/investissements", libelle: "Investissements", icone: "▲" },
      { chemin: "/objectifs", libelle: "Objectifs", icone: "◎" },
    ],
  },
  {
    titre: "Configuration",
    liens: [
      { chemin: "/categories", libelle: "Catégories", icone: "◫" },
      { chemin: "/reglages", libelle: "Réglages", icone: "⚙" },
    ],
  },
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
        {GROUPES_NAVIGATION.map((groupe, indexGroupe) => (
          /*
            La clé est le titre quand il existe, l'index sinon :
            un seul groupe est sans titre, il ne peut donc pas
            entrer en collision.
          */
          <div key={groupe.titre ?? indexGroupe} className="sidebar__groupe">
            {groupe.titre && (
              <span className="sidebar__groupe-titre">{groupe.titre}</span>
            )}

            {groupe.liens.map((lien) => (
              <NavLink
                key={lien.chemin}
                to={lien.chemin}
                end={lien.chemin === "/"}
                className={({ isActive }) =>
                  isActive
                    ? "sidebar__lien sidebar__lien--actif"
                    : "sidebar__lien"
                }
              >
                <span className="sidebar__icone" aria-hidden="true">
                  {lien.icone}
                </span>
                {lien.libelle}
              </NavLink>
            ))}
          </div>
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