// ============================================================
// COMPOSANT PRINCIPAL FINANCEPILOT
// ============================================================
//
// Rôle : assembler les hooks de domaine, gérer l'affichage
// connecté/déconnecté, et déclarer les routes de l'application.
//
// contexteRoutes regroupe les données de chaque hook et les
// transmet aux pages via Layout → Outlet, pour éviter de
// répéter les mêmes props sur chaque <Route>.

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import AuthForm from "./components/AuthForm.jsx"
import Layout from "./components/Layout.jsx"

import PageDashboard from "./pages/PageDashboard.jsx"
import PageTransactions from "./pages/PageTransactions.jsx"
import PageComptes from "./pages/PageComptes.jsx"
import PageCategories from "./pages/PageCategories.jsx"
import PageBudgets from "./pages/PageBudgets.jsx"
import PageObjectifs from "./pages/PageObjectifs.jsx"
import PageInvestissements from "./pages/PageInvestissements.jsx"

import { useAuth } from "./hooks/useAuth.js"
import { useComptes } from "./hooks/useComptes.js"
import { useCategories } from "./hooks/useCategories.js"
import { useBudgets } from "./hooks/useBudgets.js"
import { useTransactions } from "./hooks/useTransactions.js"
import { useOperationsInvestissement } from "./hooks/useOperationsInvestissement.js"

function App() {
  const {
    utilisateur,
    message,
    setMessage,
    gererConnexion,
    gererInscription,
    gererDeconnexion,
  } = useAuth()

  const comptesData = useComptes(utilisateur, setMessage)
  const categoriesData = useCategories(utilisateur, setMessage)
  const budgetsData = useBudgets(utilisateur, setMessage)
  const transactionsData = useTransactions(utilisateur, setMessage)
  const operationsData = useOperationsInvestissement(utilisateur, setMessage)

  if (!utilisateur) {
    return (
      <main className="page-connexion">
        <div className="page-connexion__marque">
          <span className="page-connexion__logo">FP</span>
          <h1>FinancePilot</h1>
          <p>Gérez vos finances simplement.</p>
        </div>

        <AuthForm onConnexion={gererConnexion} onInscription={gererInscription} />

        {message && <p className="page-connexion__message">{message}</p>}
      </main>
    )
  }

  const contexteRoutes = {
    ...comptesData,
    ...categoriesData,
    ...budgetsData,
    ...transactionsData,
    ...operationsData,
    message,
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Layout
              utilisateur={utilisateur}
              onDeconnexion={gererDeconnexion}
              contexteRoutes={contexteRoutes}
            />
          }
        >
          <Route path="/" element={<PageDashboard />} />
          <Route path="/transactions" element={<PageTransactions />} />
          <Route path="/comptes" element={<PageComptes />} />
          <Route path="/categories" element={<PageCategories />} />
          <Route path="/budgets" element={<PageBudgets />} />
          <Route path="/objectifs" element={<PageObjectifs />} />
          <Route path="/investissements" element={<PageInvestissements />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App