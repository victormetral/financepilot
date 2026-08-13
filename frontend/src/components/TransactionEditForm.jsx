import { useState } from "react"

// ============================================================
// FORMULAIRE DE MODIFICATION D'UNE TRANSACTION
// ============================================================
//
// Rôle : le PUT backend exige tous les champs métier, donc ils
// sont tous pré-remplis puis renvoyés ensemble.
//
// Utilisé par : TransactionList.jsx

function TransactionEditForm({
  transaction,
  comptes,
  categories,
  onModification,
  onAnnulation,
}) {
  const [compteId, setCompteId] = useState(transaction.compte_id)
  const [categorieId, setCategorieId] = useState(transaction.categorie_id ?? "")
  const [libelle, setLibelle] = useState(transaction.libelle)
  const [montant, setMontant] = useState(transaction.montant)
  const [dateTransaction, setDateTransaction] = useState(
    transaction.date_transaction.split("T")[0]
  )
  const [typeTransaction, setTypeTransaction] = useState(
    transaction.type_transaction
  )

  function gererEnvoi(event) {
    event.preventDefault()

    onModification(transaction.id, {
      compteId,
      categorieId: categorieId || null,
      libelle,
      montant,
      dateTransaction,
      typeTransaction,
    })
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor={`compteTransactionModifiee-${transaction.id}`}>
          Compte
        </label>
        <select
          id={`compteTransactionModifiee-${transaction.id}`}
          value={compteId}
          onChange={(event) => setCompteId(event.target.value)}
          required
        >
          {comptes.map((compte) => (
            <option key={compte.id} value={compte.id}>
              {compte.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`categorieTransactionModifiee-${transaction.id}`}>
          Catégorie
        </label>
        <select
          id={`categorieTransactionModifiee-${transaction.id}`}
          value={categorieId}
          onChange={(event) => setCategorieId(event.target.value)}
        >
          <option value="">Aucune catégorie</option>
          {categories.map((categorie) => (
            <option key={categorie.id} value={categorie.id}>
              {categorie.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`libelleTransactionModifiee-${transaction.id}`}>
          Libellé
        </label>
        <input
          id={`libelleTransactionModifiee-${transaction.id}`}
          type="text"
          value={libelle}
          onChange={(event) => setLibelle(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`montantTransactionModifiee-${transaction.id}`}>
          Montant (€)
        </label>
        <input
          id={`montantTransactionModifiee-${transaction.id}`}
          type="number"
          step="0.01"
          value={montant}
          onChange={(event) => setMontant(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`dateTransactionModifiee-${transaction.id}`}>
          Date
        </label>
        <input
          id={`dateTransactionModifiee-${transaction.id}`}
          type="date"
          value={dateTransaction}
          onChange={(event) => setDateTransaction(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`typeTransactionModifiee-${transaction.id}`}>
          Type
        </label>
        <select
          id={`typeTransactionModifiee-${transaction.id}`}
          value={typeTransaction}
          onChange={(event) => setTypeTransaction(event.target.value)}
          required
        >
          <option value="depense">Dépense</option>
          <option value="revenu">Revenu</option>
          <option value="transfert">Transfert</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "var(--espace-2)" }}>
        <button type="submit" className="formulaire__bouton">
          Enregistrer
        </button>
        <button type="button" className="bouton-secondaire" onClick={onAnnulation}>
          Annuler
        </button>
      </div>
    </form>
  )
}

export default TransactionEditForm