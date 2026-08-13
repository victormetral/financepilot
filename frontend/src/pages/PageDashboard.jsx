// ============================================================
// PAGE — TABLEAU DE BORD
// ============================================================
//
// Rôle actuel : placeholder. Le contenu réel (patrimoine net,
// reste-à-vivre, coût d'opportunité) sera construit au Lot 7,
// une fois le layout général validé.
//
// Utilisé par : App.jsx (route /)

function PageDashboard() {
  return (
    <div className="page">
      <header className="page__entete">
        <h1>Tableau de bord</h1>
        <p className="page__sous-titre">
          Vue d'ensemble de vos finances — arrive au prochain lot.
        </p>
      </header>
    </div>
  )
}

export default PageDashboard