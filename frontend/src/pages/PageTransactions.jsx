// ============================================================
// PAGE — TRANSACTIONS
// ============================================================
//
// Utilisé par : App.jsx (route /transactions)
// Utilise : SaisieExpress.jsx, TransactionForm.jsx,
//           TransactionList.jsx

import { useOutletContext } from "react-router-dom"
import SaisieExpress from "../components/SaisieExpress.jsx"
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
    message,
  } = useOutletContext()

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Transactions</h1>
        <p className="page__sous-titre">
          Enregistrez vos dépenses, revenus et transferts.
        </p>
      </header>

      {message && <p className="page__message">{message}</p>}

      {/*
        La saisie express passe en premier : c'est le geste
        quotidien. Le formulaire complet reste dessous pour
        les cas que la phrase ne couvre pas (date passée,
        transfert, catégorie non devinée).
      */}
      <section className="page__section">
        <SaisieExpress
          comptes={comptes}
          categories={categories}
          onCreation={gererCreationTransaction}
        />
      </section>

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