import { useState } from "react"

import BudgetEditForm from "./BudgetEditForm.jsx"

/*
  LISTE DES BUDGETS

  Affiche les budgets reçus de l'API.
  Un seul budget peut être ouvert en modification à la fois.
*/

function BudgetList({
  budgets,
  categories,
  onModification,
  onSuppression,
}) {
  const [budgetEnModificationId, setBudgetEnModificationId] =
    useState(null)

  function ouvrirModification(budgetId) {
    setBudgetEnModificationId(budgetId)
  }

  function fermerModification() {
    setBudgetEnModificationId(null)
  }

  function formaterMontant(montant) {
    return Number(montant).toFixed(2)
  }

  if (budgets.length === 0) {
    return <p>Aucun budget créé.</p>
  }

  return (
    <section>
      <h3>Mes budgets</h3>

      {budgets.map((budget) => (
        <article key={budget.id}>
          {budgetEnModificationId === budget.id ? (
            <BudgetEditForm
              budget={budget}
              categories={categories}
              onModification={onModification}
              onAnnulation={fermerModification}
            />
          ) : (
            <>
              <h4>{budget.nom_categorie}</h4>
              <p>
                Limite : {formaterMontant(budget.montant_limite)} €
              </p>
              <p>
                Période : {budget.mois}/{budget.annee}
              </p>

              <button
                type="button"
                onClick={() => ouvrirModification(budget.id)}
              >
                Modifier
              </button>

              <button
                type="button"
                onClick={() => onSuppression(budget.id)}
              >
                Supprimer
              </button>
            </>
          )}
        </article>
      ))}
    </section>
  )
}

export default BudgetList