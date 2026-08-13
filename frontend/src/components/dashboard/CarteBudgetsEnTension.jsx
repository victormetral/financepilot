// ============================================================
// CARTE — BUDGETS EN TENSION
// ============================================================
//
// Rôle : niveau 3 de lecture — les budgets les plus consommés
// en proportion, pour repérer vite où ça déborde.
//
// Utilisé par : pages/PageDashboard.jsx
// Utilise : utils/finance.utils.js

import { formaterMontant, formaterPourcentage } from "../../utils/finance.utils.js"

function CarteBudgetsEnTension({ budgetsEnTension }) {
  if (budgetsEnTension.length === 0) {
    return (
      <div className="carte-budgets-tension">
        <span className="carte-budgets-tension__libelle">
          Budgets en tension
        </span>
        <p className="carte-budgets-tension__vide">
          Aucun budget actif ce mois-ci.
        </p>
      </div>
    )
  }

  return (
    <div className="carte-budgets-tension">
      <span className="carte-budgets-tension__libelle">
        Budgets en tension
      </span>

      <ul className="carte-budgets-tension__liste">
        {budgetsEnTension.map((budget) => {
          const depasse = budget.proportion > 1

          return (
            <li key={budget.id} className="carte-budgets-tension__item">
              <div className="carte-budgets-tension__entete">
                <span>{budget.nom_categorie ?? "Catégorie"}</span>
                <span className="chiffre">
                  {formaterPourcentage(budget.proportion * 100, 0)}
                </span>
              </div>

              <div className="carte-budgets-tension__barre">
                <div
                  className="carte-budgets-tension__progression"
                  style={{ width: `${Math.min(budget.proportion * 100, 100)}%` }}
                  data-depasse={depasse}
                />
              </div>

              <span className="carte-budgets-tension__montants">
                {formaterMontant(budget.depense)} /{" "}
                {formaterMontant(budget.montant_limite)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default CarteBudgetsEnTension