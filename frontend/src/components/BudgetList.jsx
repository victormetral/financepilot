import { useState } from "react"

import BudgetEditForm from "./BudgetEditForm.jsx"

// ============================================================
// LISTE DES BUDGETS
// ============================================================
//
// Rôle : affiche les budgets avec leur période et leurs actions.
// Un seul budget peut être ouvert en modification à la fois.
//
// Utilisé par : pages/PageBudgets.jsx
// Utilise : BudgetEditForm.jsx

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function formaterMontant(montant) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(montant))
}

function formaterPeriode(mois, annee) {
  return `${NOMS_MOIS[Number(mois) - 1]} ${annee}`
}

function BudgetList({ budgets, categories, onModification, onSuppression }) {
  const [budgetEnModificationId, setBudgetEnModificationId] = useState(null)

  // Après une modification réussie, on referme le formulaire.
  async function gererModification(budgetId, donneesFormulaire) {
    const modificationReussie = await onModification(budgetId, donneesFormulaire)

    if (modificationReussie) {
      setBudgetEnModificationId(null)
    }
  }

  if (budgets.length === 0) {
    return <p className="liste__vide">Aucun budget créé.</p>
  }

  return (
    <ul className="liste">
      {budgets.map((budget) => (
        <li key={budget.id} className="liste__element">
          {budgetEnModificationId === budget.id ? (
            <BudgetEditForm
              budget={budget}
              categories={categories}
              onModification={gererModification}
              onAnnulation={() => setBudgetEnModificationId(null)}
            />
          ) : (
            <>
              <div className="liste__contenu">
                <span className="liste__titre">{budget.nom_categorie}</span>
                <span className="liste__detail">
                  {formaterMontant(budget.montant_limite)} ·{" "}
                  {formaterPeriode(budget.mois, budget.annee)}
                </span>
              </div>

              <div className="liste__actions">
                <button
                  type="button"
                  className="bouton-secondaire"
                  onClick={() => setBudgetEnModificationId(budget.id)}
                >
                  Modifier
                </button>

                <button
                  type="button"
                  className="bouton-danger"
                  onClick={() => onSuppression(budget.id)}
                >
                  Supprimer
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

export default BudgetList