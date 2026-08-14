import TransactionEditForm from "./TransactionEditForm.jsx"

import { useReglages } from "../hooks/useReglages.js"

import {
  calculerCoutOpportunite,
  formaterMontant,
} from "../utils/finance.utils.js"

// ============================================================
// LISTE DES TRANSACTIONS
// ============================================================
//
// Rôle : afficher les transactions et leurs boutons d'action.
//
// Chaque dépense affiche aussi son coût d'opportunité : ce que
// ce montant vaudrait s'il avait été investi. C'est une aide à
// la décision, pas un reproche — d'où la présentation discrète
// et la possibilité de désactiver l'affichage dans les réglages.
//
// Utilisé par : pages/PageTransactions.jsx
// Utilise : TransactionEditForm.jsx, hooks/useReglages.js

function formaterDate(dateIso) {
  return dateIso.split("T")[0]
}

function formaterMontantSimple(montant) {
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
  const { reglages } = useReglages()

  if (transactions.length === 0) {
    return <p className="liste__vide">Aucune transaction enregistrée.</p>
  }

  return (
    <ul className="liste">
      {transactions.map((transaction) => {
        if (transactionEnModification === transaction.id) {
          return (
            <li key={transaction.id} className="liste__element">
              <TransactionEditForm
                transaction={transaction}
                comptes={comptes}
                categories={categories}
                onModification={onModification}
                onAnnulation={onAnnulation}
              />
            </li>
          )
        }

        const estDepense = transaction.type_transaction === "depense"

        const afficherCoutOpportunite =
          reglages.coutOpportuniteActif && estDepense

        const valeurFuture = afficherCoutOpportunite
          ? calculerCoutOpportunite(
              transaction.montant,
              reglages.tauxRendement / 100,
              reglages.horizonAnnees
            )
          : 0

        return (
          <li key={transaction.id} className="liste__element">
            <div className="liste__contenu">
              <span className="liste__titre">{transaction.libelle}</span>
              <span className="liste__detail">
                {formaterDate(transaction.date_transaction)} ·{" "}
                {formaterMontantSimple(transaction.montant)} ·{" "}
                {LIBELLES_TYPE[transaction.type_transaction]}
                {transaction.nom_categorie && ` · ${transaction.nom_categorie}`}
              </span>

              {afficherCoutOpportunite && (
                <span className="transaction__opportunite">
                  ≈ {formaterMontant(valeurFuture)} dans{" "}
                  {reglages.horizonAnnees} ans si investi
                </span>
              )}
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
          </li>
        )
      })}
    </ul>
  )
}

export default TransactionList