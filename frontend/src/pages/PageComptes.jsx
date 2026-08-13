// ============================================================
// PAGE — COMPTES BANCAIRES
// ============================================================
//
// Rôle : reprend le formulaire et la liste de comptes déjà
// existants, mais comme route indépendante plutôt que comme
// section d'une page unique.
//
// Récupère ses données via useOutletContext() : elles viennent
// de contexteRoutes, assemblé dans App.jsx et transmis par
// Layout.jsx.
//
// Utilisé par : App.jsx (route /comptes)
// Utilise : CompteForm.jsx, CompteList.jsx

import { useOutletContext } from "react-router-dom"
import CompteForm from "../components/CompteForm.jsx"
import CompteList from "../components/CompteList.jsx"

function PageComptes() {
  const {
    comptes,
    compteEnModification,
    setCompteEnModification,
    gererCreationCompte,
    gererModificationCompte,
    gererSuppressionCompte,
  } = useOutletContext()

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Comptes bancaires</h1>
        <p className="page__sous-titre">
          Gérez vos comptes et leurs soldes.
        </p>
      </header>

      <section className="page__section">
        <h2>Ajouter un compte</h2>
        <CompteForm onCreation={gererCreationCompte} />
      </section>

      <section className="page__section">
        <h2>Vos comptes</h2>
        <CompteList
          comptes={comptes}
          compteEnModification={compteEnModification}
          onDemarrerModification={setCompteEnModification}
          onModification={gererModificationCompte}
          onAnnulation={() => setCompteEnModification(null)}
          onSuppression={gererSuppressionCompte}
        />
      </section>
    </div>
  )
}

export default PageComptes