// ============================================================
// LISTE DES COMPTES BANCAIRES
// ============================================================
//
// Rôle : afficher les comptes et leurs boutons d'action.
// Utilisé par : App.jsx.
// Utilise : CompteEditForm.jsx.

import CompteEditForm from "./CompteEditForm.jsx"

function CompteList({
  comptes,
  compteEnModification,
  onDemarrerModification,
  onModification,
  onAnnulation,
  onSuppression
}) {
  if (comptes.length === 0) {
    return <p>Aucun compte bancaire enregistré.</p>
  }

  return (
    <ul>
      {comptes.map((compte) => (
        <li key={compte.id}>
          {compte.nom}
          {" — "}
          {compte.solde_initial}
          {" "}
          {compte.devise}

          <button
            type="button"
            onClick={() => onDemarrerModification(compte.id)}
          >
            Modifier
          </button>

          <button
            type="button"
            onClick={() => onSuppression(compte.id)}
          >
            Supprimer
          </button>

          {compteEnModification === compte.id && (
            <CompteEditForm
              compte={compte}
              onModification={onModification}
              onAnnulation={onAnnulation}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

export default CompteList
