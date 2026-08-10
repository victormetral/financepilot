// ============================================================
// COMPOSANT PRINCIPAL FINANCEPILOT
// ============================================================
//
// Rôle : assembler les hooks de domaine (auth, comptes,
// catégories, budgets, transactions) et les transmettre aux
// composants d'affichage. Depuis Lot 4, toute la logique d'état
// vit dans hooks/ — ce fichier ne fait plus que du branchement.

import AuthForm from "./components/AuthForm.jsx"
import CompteForm from "./components/CompteForm.jsx"
import CompteList from "./components/CompteList.jsx"
import CategorieForm from "./components/CategorieForm.jsx"
import CategorieList from "./components/CategorieList.jsx"
import BudgetForm from "./components/BudgetForm.jsx"
import BudgetList from "./components/BudgetList.jsx"
import TransactionForm from "./components/TransactionForm.jsx"
import TransactionList from "./components/TransactionList.jsx"

import { useAuth } from "./hooks/useAuth.js"
import { useComptes } from "./hooks/useComptes.js"
import { useCategories } from "./hooks/useCategories.js"
import { useBudgets } from "./hooks/useBudgets.js"
import { useTransactions } from "./hooks/useTransactions.js"

function App() {
  const {
    utilisateur,
    message,
    setMessage,
    gererConnexion,
    gererInscription,
    gererDeconnexion,
  } = useAuth()

  const {
    comptes,
    compteEnModification,
    setCompteEnModification,
    gererCreationCompte,
    gererModificationCompte,
    gererSuppressionCompte,
  } = useComptes(utilisateur, setMessage)

  const {
    categories,
    categorieEnModification,
    setCategorieEnModification,
    gererCreationCategorie,
    gererModificationCategorie,
    gererSuppressionCategorie,
  } = useCategories(utilisateur, setMessage)

  const {
    budgets,
    gererCreationBudget,
    gererModificationBudget,
    gererSuppressionBudget,
  } = useBudgets(utilisateur, setMessage)

  const {
    transactions,
    transactionEnModification,
    setTransactionEnModification,
    gererCreationTransaction,
    gererModificationTransaction,
    gererSuppressionTransaction,
  } = useTransactions(utilisateur, setMessage)

  return (
    <main>
      <h1>FinancePilot</h1>
      <p>Gérez vos finances simplement.</p>

      <section>
        {!utilisateur && (
          <AuthForm onConnexion={gererConnexion} onInscription={gererInscription} />
        )}

        {message && <p>{message}</p>}

        {utilisateur && (
          <div>
            <h2>Utilisateur connecté</h2>
            <p>Email : {utilisateur.email}</p>

            <h2>Créer un compte bancaire</h2>
            <CompteForm onCreation={gererCreationCompte} />

            <h2>Mes comptes</h2>
            <CompteList
              comptes={comptes}
              compteEnModification={compteEnModification}
              onDemarrerModification={setCompteEnModification}
              onModification={gererModificationCompte}
              onAnnulation={() => setCompteEnModification(null)}
              onSuppression={gererSuppressionCompte}
            />

            <h2>Créer une catégorie</h2>
            <CategorieForm onCreation={gererCreationCategorie} />

            <h2>Mes catégories</h2>
            <CategorieList
              categories={categories}
              categorieEnModification={categorieEnModification}
              onDemarrerModification={setCategorieEnModification}
              onModification={gererModificationCategorie}
              onAnnulation={() => setCategorieEnModification(null)}
              onSuppression={gererSuppressionCategorie}
            />

            <h2>Créer un budget</h2>
            <BudgetForm categories={categories} onCreation={gererCreationBudget} />

            <BudgetList
              budgets={budgets}
              categories={categories}
              onModification={gererModificationBudget}
              onSuppression={gererSuppressionBudget}
            />

            <h2>Créer une transaction</h2>
            <TransactionForm
              comptes={comptes}
              categories={categories}
              onCreation={gererCreationTransaction}
            />

            <h2>Mes transactions</h2>
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

            <button type="button" onClick={gererDeconnexion}>
              Se déconnecter
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default App