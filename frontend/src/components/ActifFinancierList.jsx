// ============================================================
// LISTE DES ACTIFS FINANCIERS
// ============================================================
//
// Rôle : afficher le référentiel d'actifs disponibles.
//
// La suppression est proposée à tous mais refusée par le backend
// (403) si l'utilisateur n'est pas administrateur, ou (409) si
// l'actif est encore utilisé par une opération.
//
// Utilisé par : pages/PageInvestissements.jsx

const LIBELLES_TYPE = {
  action: "Action",
  etf: "ETF",
  crypto: "Cryptomonnaie",
  obligation: "Obligation",
  fonds: "Fonds",
  immobilier: "Immobilier",
  autre: "Autre",
}

function ActifFinancierList({ actifsFinanciers, onSuppression }) {
  if (actifsFinanciers.length === 0) {
    return <p className="liste__vide">Aucun actif dans le référentiel.</p>
  }

  return (
    <ul className="liste">
      {actifsFinanciers.map((actif) => (
        <li key={actif.id} className="liste__element">
          <div className="liste__contenu">
            <span className="liste__titre">
              {actif.symbole} — {actif.nom}
            </span>
            <span className="liste__detail">
              {LIBELLES_TYPE[actif.type_actif]} · {actif.devise}
            </span>
          </div>

          <div className="liste__actions">
            <button
              type="button"
              className="bouton-danger"
              onClick={() => onSuppression(actif.id)}
            >
              Supprimer
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ActifFinancierList