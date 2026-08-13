// ============================================================
// LISTE DES TRANSACTIONS
// ============================================================
//
// Rôle : afficher les transactions et leurs boutons d'action.
// Utilisé par : pages/PageTransactions.jsx
// Utilise : TransactionEditForm.jsx

import TransactionEditForm from "./TransactionEditForm.jsx"

// Affiche uniquement la partie date (avant le "T"), sans l'heure UTC.
function formaterDate(dateIso) {
  return dateIso.split("T")[0]
}

function formaterMontant(montant) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(Number(montant))
}

const LIBELLES_TYPE = {
  depense: "Dépense",
  revenu: "Revenu",
  transfert: "Transfert",
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
    return <p className="liste__vide">Aucune transaction enregistrée.</p>
  }

  return (
    <ul className="liste">
      {transactions.map((transaction) => (
        <li key={transaction.id} className="liste__element">
          {transactionEnModification === transaction.id ? (
            <TransactionEditForm
              transaction={transaction}
              comptes={comptes}
              categories={categories}
              onModification={onModification}
              onAnnulation={onAnnulation}
            />
          ) : (
            <>
              <div className="liste__contenu">
                <span className="liste__titre">{transaction.libelle}</span>
                <span className="liste__detail">
                  {formaterDate(transaction.date_transaction)} ·{" "}
                  {formaterMontant(transaction.montant)} ·{" "}
                  {LIBELLES_TYPE[transaction.type_transaction]}
                  {transaction.nom_categorie && ` · ${transaction.nom_categorie}`}
                </span>
              </div>

              <div className="liste__actions">
                <button
                  type="button"
                  className="bouton-secondaire"
                  onClick={() => onDemarrerModification(transaction.id)}
                >
                  Modifier
                </button>

                <button
                  type="button"
                  className="bouton-danger"
                  onClick={() => onSuppression(transaction.id)}
                >
                  Supprimer
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

export default TransactionList