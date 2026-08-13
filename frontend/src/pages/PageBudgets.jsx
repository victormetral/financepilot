// ============================================================
// PAGE — BUDGETS
// ============================================================
//
// Utilisé par : App.jsx (route /budgets)
// Utilise : BudgetForm.jsx, BudgetList.jsx

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
    message,
  } = useOutletContext()

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Budgets</h1>
        <p className="page__sous-titre">
          Fixez des limites mensuelles par catégorie.
        </p>
      </header>

      {message && <p className="page__message">{message}</p>}

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