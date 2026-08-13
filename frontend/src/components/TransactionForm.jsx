import { useState } from "react"

// ============================================================
// FORMULAIRE DE CRÉATION D'UNE TRANSACTION
// ============================================================
//
// Rôle : saisir une nouvelle transaction. Nécessite au moins
// un compte existant (catégorie facultative, cohérent avec
// categorie_id nullable côté backend).
//
// Utilisé par : pages/PageTransactions.jsx

function TransactionForm({ comptes, categories, onCreation }) {
  const [compteId, setCompteId] = useState("")
  const [categorieId, setCategorieId] = useState("")
  const [libelle, setLibelle] = useState("")
  const [montant, setMontant] = useState("")
  const [dateTransaction, setDateTransaction] = useState("")
  const [typeTransaction, setTypeTransaction] = useState("depense")

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({
      compteId,
      categorieId: categorieId || null,
      libelle,
      montant,
      dateTransaction,
      typeTransaction,
    })

    if (creationReussie) {
      setLibelle("")
      setMontant("")
      setDateTransaction("")
    }
  }

  if (comptes.length === 0) {
    return (
      <p className="liste__vide">
        Créez d'abord un compte pour pouvoir enregistrer une transaction.
      </p>
    )
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor="compteTransaction">Compte</label>
        <select
          id="compteTransaction"
          value={compteId}
          onChange={(event) => setCompteId(event.target.value)}
          required
        >
          <option value="">Choisir un compte</option>
          {comptes.map((compte) => (
            <option key={compte.id} value={compte.id}>
              {compte.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="categorieTransaction">Catégorie (facultatif)</label>
        <select
          id="categorieTransaction"
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
        <label htmlFor="libelleTransaction">Libellé</label>
        <input
          id="libelleTransaction"
          type="text"
          placeholder="Courses, Salaire, Loyer…"
          value={libelle}
          onChange={(event) => setLibelle(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="montantTransaction">Montant (€)</label>
        <input
          id="montantTransaction"
          type="number"
          step="0.01"
          placeholder="42.50"
          value={montant}
          onChange={(event) => setMontant(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="dateTransaction">Date</label>
        <input
          id="dateTransaction"
          type="date"
          value={dateTransaction}
          onChange={(event) => setDateTransaction(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="typeTransaction">Type</label>
        <select
          id="typeTransaction"
          value={typeTransaction}
          onChange={(event) => setTypeTransaction(event.target.value)}
          required
        >
          <option value="depense">Dépense</option>
          <option value="revenu">Revenu</option>
          <option value="transfert">Transfert</option>
        </select>
      </div>

      <button type="submit" className="formulaire__bouton">
        Créer la transaction
      </button>
    </form>
  )
}

export default TransactionForm