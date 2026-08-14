// ============================================================
// PAGE — TABLEAU DE BORD
// ============================================================
//
// Rôle : vue d'ensemble des finances — patrimoine net, flux du
// mois, reste-à-vivre, budgets en tension. Affiche un message
// d'accueil tant qu'aucune donnée n'a été créée, plutôt que des
// cartes vides sans signification.
//
// Utilisé par : App.jsx (route /)
// Utilise : hooks/useTableauDeBord.js, components/dashboard/*

import { Link, useOutletContext } from "react-router-dom"

import { useTableauDeBord } from "../hooks/useTableauDeBord.js"

import CartePatrimoine from "../components/dashboard/CartePatrimoine.jsx"
import CarteFluxMois from "../components/dashboard/CarteFluxMois.jsx"
import CarteResteAVivre from "../components/dashboard/CarteResteAVivre.jsx"
import CarteBudgetsEnTension from "../components/dashboard/CarteBudgetsEnTension.jsx"

function PageDashboard() {
  const { comptes, transactions, budgets, operationsInvestissement } =
    useOutletContext()

  const {
    patrimoineNet,
    liquidites,
    valeurPortefeuille,
    fluxDuMois,
    resteAVivre,
    budgetsEnTension,
    aucuneDonnee,
    moisCourant,
    anneeCourante,
  } = useTableauDeBord(comptes, transactions, budgets, operationsInvestissement)

  if (aucuneDonnee) {
    return (
      <div className="tableau-de-bord">
        <header className="page__entete">
          <h1>Tableau de bord</h1>
          <p className="page__sous-titre">
            Vue d'ensemble de vos finances.
          </p>
        </header>

        <div className="tableau-de-bord__accueil">
          <p>
            Votre tableau de bord se remplit automatiquement dès que vous
            ajoutez des données. Commencez par créer un compte bancaire,
            puis enregistrez quelques transactions.
          </p>

          <div className="tableau-de-bord__accueil-liens">
            <Link to="/comptes" className="tableau-de-bord__accueil-lien">
              Créer un compte
            </Link>
            <Link
              to="/transactions"
              className="tableau-de-bord__accueil-lien"
            >
              Ajouter une transaction
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="tableau-de-bord">
      <header className="page__entete">
        <h1>Tableau de bord</h1>
        <p className="page__sous-titre">Vue d'ensemble de vos finances.</p>
      </header>

      <CartePatrimoine
        patrimoineNet={patrimoineNet}
        liquidites={liquidites}
        valeurPortefeuille={valeurPortefeuille}
      />

      <div className="tableau-de-bord__grille">
        <CarteFluxMois
          fluxDuMois={fluxDuMois}
          mois={moisCourant}
          annee={anneeCourante}
        />
        <CarteResteAVivre resteAVivre={resteAVivre} />
      </div>

      <div className="tableau-de-bord__grille tableau-de-bord__grille--deux">
        <CarteBudgetsEnTension budgetsEnTension={budgetsEnTension} />
      </div>
    </div>
  )
}

export default PageDashboard