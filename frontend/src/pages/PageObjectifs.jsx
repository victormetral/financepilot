// ============================================================
// PAGE — OBJECTIFS
// ============================================================
//
// Rôle : gérer les objectifs d'épargne et suivre leur progression.
//
// L'épargne mensuelle vient du tableau de bord (flux du mois) :
// elle sert à projeter une date d'atteinte réaliste plutôt que
// de demander à l'utilisateur d'estimer son propre rythme.
//
// Utilisé par : App.jsx (route /objectifs)
// Utilise : ObjectifForm.jsx, ObjectifList.jsx, useTableauDeBord.js

import { useOutletContext } from "react-router-dom"

import ObjectifForm from "../components/ObjectifForm.jsx"
import ObjectifList from "../components/ObjectifList.jsx"

import { useTableauDeBord } from "../hooks/useTableauDeBord.js"

function PageObjectifs() {
  const {
    objectifs,
    objectifEnModification,
    setObjectifEnModification,
    gererCreationObjectif,
    gererModificationObjectif,
    gererSuppressionObjectif,
    comptes,
    transactions,
    budgets,
    operationsInvestissement,
    message,
  } = useOutletContext()

  const { fluxDuMois } = useTableauDeBord(
    comptes,
    transactions,
    budgets,
    operationsInvestissement
  )

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Objectifs</h1>
        <p className="page__sous-titre">
          Fixez vos objectifs d'épargne et suivez leur progression.
        </p>
      </header>

      {message && <p className="page__message">{message}</p>}

      <section className="page__section">
        <h2>Ajouter un objectif</h2>
        <ObjectifForm onCreation={gererCreationObjectif} />
      </section>

      <section className="page__section">
        <h2>Vos objectifs</h2>
        <ObjectifList
          objectifs={objectifs}
          epargneMensuelle={fluxDuMois.epargne}
          objectifEnModification={objectifEnModification}
          onDemarrerModification={setObjectifEnModification}
          onModification={gererModificationObjectif}
          onAnnulation={() => setObjectifEnModification(null)}
          onSuppression={gererSuppressionObjectif}
        />
      </section>
    </div>
  )
}

export default PageObjectifs