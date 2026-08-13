// ============================================================
// PAGE — CATÉGORIES
// ============================================================
//
// Utilisé par : App.jsx (route /categories)
// Utilise : CategorieForm.jsx, CategorieList.jsx
//
// `message` vient du contexte partagé (useAuth) : il porte les
// retours de toutes les actions (création, modification,
// suppression), y compris les erreurs 409 quand une catégorie
// est encore utilisée par un budget ou une transaction.

import { useOutletContext } from "react-router-dom"
import CategorieForm from "../components/CategorieForm.jsx"
import CategorieList from "../components/CategorieList.jsx"

function PageCategories() {
  const {
    categories,
    categorieEnModification,
    setCategorieEnModification,
    gererCreationCategorie,
    gererModificationCategorie,
    gererSuppressionCategorie,
    message,
  } = useOutletContext()

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Catégories</h1>
        <p className="page__sous-titre">
          Organisez vos dépenses et revenus par catégorie.
        </p>
      </header>

      {message && <p className="page__message">{message}</p>}

      <section className="page__section">
        <h2>Ajouter une catégorie</h2>
        <CategorieForm onCreation={gererCreationCategorie} />
      </section>

      <section className="page__section">
        <h2>Vos catégories</h2>
        <CategorieList
          categories={categories}
          categorieEnModification={categorieEnModification}
          onDemarrerModification={setCategorieEnModification}
          onModification={gererModificationCategorie}
          onAnnulation={() => setCategorieEnModification(null)}
          onSuppression={gererSuppressionCategorie}
        />
      </section>
    </div>
  )
}

export default PageCategories