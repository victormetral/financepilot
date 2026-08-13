// ============================================================
// PAGE — BUDGETS
// ============================================================
//
// Utilisé par : App.jsx (route /budgets)
// Utilise : BudgetForm.jsx, BudgetList.jsx
//
// BudgetForm a besoin de la liste des catégories pour son
// <select> : elle vient aussi du contexte partagé.

import { useOutletContext } from "react-router-dom"
import BudgetForm from "../components/BudgetForm.jsx"
import BudgetList from "../components/BudgetList.jsx"

function PageBudgets() {
  const {
    categories,
    budgets,
    gererCreationBudget,
    gererModificationBudget,
    gererSuppressionBudget,
  } = useOutletContext()

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Budgets</h1>
        <p className="page__sous-titre">
          Fixez des limites mensuelles par catégorie.
        </p>
      </header>

      <section className="page__section">
        <h2>Créer un budget</h2>
        <BudgetForm categories={categories} onCreation={gererCreationBudget} />
      </section>

      <section className="page__section">
        <h2>Vos budgets</h2>
        <BudgetList
          budgets={budgets}
          categories={categories}
          onModification={gererModificationBudget}
          onSuppression={gererSuppressionBudget}
        />
      </section>
    </div>
  )
}

export default PageBudgets