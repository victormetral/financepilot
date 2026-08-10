// ============================================================
// LISTE DES TRANSACTIONS
// ============================================================
//
// Rôle : afficher les transactions et leurs boutons d'action.
// Utilisé par : App.jsx.
// Utilise : TransactionEditForm.jsx.

import TransactionEditForm from "./TransactionEditForm.jsx"

// Affiche uniquement la partie date (avant le "T"), sans l'heure UTC.
function formaterDate(dateIso) {
  return dateIso.split("T")[0]
}

function TransactionList({
  transactions,
  comptes,
  categories,
  transactionEnModification,
  onDemarrerModification,
  onModification,
  onAnnulation,
  onSuppression,
}) {
  if (transactions.length === 0) {
    return <p>Aucune transaction enregistrée.</p>
  }

  return (
    <ul>
      {transactions.map((transaction) => (
        <li key={transaction.id}>
          {formaterDate(transaction.date_transaction)}
          {" — "}
          {transaction.libelle}
          {" — "}
          {transaction.montant}
          {" ("}
          {transaction.type_transaction}
          {")"}
          {transaction.nom_categorie && ` — ${transaction.nom_categorie}`}

          <button
            type="button"
            onClick={() => onDemarrerModification(transaction.id)}
          >
            Modifier
          </button>

          <button type="button" onClick={() => onSuppression(transaction.id)}>
            Supprimer
          </button>

          {transactionEnModification === transaction.id && (
            <TransactionEditForm
              transaction={transaction}
              comptes={comptes}
              categories={categories}
              onModification={onModification}
              onAnnulation={onAnnulation}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

export default TransactionList