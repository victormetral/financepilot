// ============================================================
// LISTE DES OPÉRATIONS D'INVESTISSEMENT
// ============================================================
//
// Rôle : historique chronologique des achats et ventes, avec
// leurs actions. Complémentaire de PositionList, qui montre
// l'état actuel plutôt que l'historique.
//
// Utilisé par : pages/PageInvestissements.jsx
// Utilise : utils/finance.utils.js

import { extraireDate, formaterMontant } from "../utils/finance.utils.js"

const LIBELLES_OPERATION = {
  achat: "Achat",
  vente: "Vente",
}

function OperationList({ operations, onSuppression }) {
  if (operations.length === 0) {
    return <p className="liste__vide">Aucune opération enregistrée.</p>
  }

  return (
    <ul className="liste">
      {operations.map((operation) => {
        const montantTotal =
          Number(operation.quantite) * Number(operation.prix_unitaire) +
          Number(operation.frais ?? 0)

        return (
          <li key={operation.id} className="liste__element">
            <div className="liste__contenu">
              <span className="liste__titre">
                {LIBELLES_OPERATION[operation.type_operation]}{" "}
                {operation.symbole_actif}
              </span>
              <span className="liste__detail">
                {extraireDate(operation.date_operation)} ·{" "}
                {operation.quantite} × {formaterMontant(operation.prix_unitaire)}{" "}
                · Total {formaterMontant(montantTotal)} · {operation.nom_compte}
              </span>
            </div>

            <div className="liste__actions">
              <button
                type="button"
                className="bouton-danger"
                onClick={() => onSuppression(operation.id)}
              >
                Supprimer
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default OperationList