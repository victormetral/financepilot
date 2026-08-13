// ============================================================
// PAGE — TRANSACTIONS
// ============================================================
//
// Utilisé par : App.jsx (route /transactions)
// Utilise : TransactionForm.jsx, TransactionList.jsx
//
// A besoin à la fois des comptes et des catégories pour ses
// <select>, en plus de ses propres données.

import { useOutletContext } from "react-router-dom"
import TransactionForm from "../components/TransactionForm.jsx"
import TransactionList from "../components/TransactionList.jsx"

function PageTransactions() {
  const {
    comptes,
    categories,
    transactions,
    transactionEnModification,
    setTransactionEnModification,
    gererCreationTransaction,
    gererModificationTransaction,
    gererSuppressionTransaction,
  } = useOutletContext()

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Transactions</h1>
        <p className="page__sous-titre">
          Enregistrez vos dépenses, revenus et transferts.
        </p>
      </header>

      <section className="page__section">
        <h2>Ajouter une transaction</h2>
        <TransactionForm
          comptes={comptes}
          categories={categories}
          onCreation={gererCreationTransaction}
        />
      </section>

      <section className="page__section">
        <h2>Vos transactions</h2>
        <TransactionList
          transactions={transactions}
          comptes={comptes}
          categories={categories}
          transactionEnModification={transactionEnModification}
          onDemarrerModification={setTransactionEnModification}
          onModification={gererModificationTransaction}
          onAnnulation={() => setTransactionEnModification(null)}
          onSuppression={gererSuppressionTransaction}
        />
      </section>
    </div>
  )
}

export default PageTransactions