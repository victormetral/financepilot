// ============================================================
// CARTE — RESTE À VIVRE
// ============================================================
//
// Rôle : ce qu'il reste à dépenser sur les catégories budgétées,
// par jour, avec un indicateur de rythme de consommation.
// Signale aussi les dépenses hors budget, pour ne pas mentir
// par omission.
//
// Utilisé par : pages/PageDashboard.jsx
// Utilise : utils/finance.utils.js

import { formaterMontant } from "../../utils/finance.utils.js"

function CarteResteAVivre({ resteAVivre }) {
  const { budgete, consomme, reste, depensesHorsBudget, joursRestants, parJour, rythme } =
    resteAVivre

  if (budgete === 0) {
    return (
      <div className="carte-reste-a-vivre">
        <span className="carte-reste-a-vivre__libelle">Reste à vivre</span>
        <p className="carte-reste-a-vivre__vide">
          Aucun budget défini pour ce mois. Créez-en un pour suivre votre
          reste à vivre.
        </p>
      </div>
    )
  }

  const proportionConsommee = Math.min(consomme / budgete, 1) * 100

  // Rythme > 1 = dépense plus vite que le budget ne le permet.
  const enSurchauffe = rythme > 1.05

  return (
    <div className="carte-reste-a-vivre">
      <span className="carte-reste-a-vivre__libelle">Reste à vivre</span>

      <div className="carte-reste-a-vivre__principal">
        <span className="chiffre">{formaterMontant(reste)}</span>
        <span className="carte-reste-a-vivre__sur">
          sur {joursRestants} jour{joursRestants > 1 ? "s" : ""}
        </span>
      </div>

      <p className="carte-reste-a-vivre__par-jour">
        Soit <strong className="chiffre">{formaterMontant(parJour)}</strong> par jour
      </p>

      <div className="carte-reste-a-vivre__barre">
        <div
          className="carte-reste-a-vivre__progression"
          style={{ width: `${proportionConsommee}%` }}
          data-surchauffe={enSurchauffe}
        />
      </div>

      <div className="carte-reste-a-vivre__pied">
        <span>
          {formaterMontant(consomme)} / {formaterMontant(budgete)} budgété
        </span>
        {enSurchauffe && (
          <span className="carte-reste-a-vivre__alerte">
            Rythme de dépense au-dessus du budget
          </span>
        )}
      </div>

      {depensesHorsBudget > 0 && (
        <p className="carte-reste-a-vivre__hors-budget">
          + {formaterMontant(depensesHorsBudget)} dépensés hors catégories
          budgétées
        </p>
      )}
    </div>
  )
}

export default CarteResteAVivre