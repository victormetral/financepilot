import { useState } from "react"

// ============================================================
// FORMULAIRE DE CRÉATION D'UNE TRANSACTION
// ============================================================
//
// Rôle : saisir une nouvelle transaction. Nécessite au moins
// un compte existant (catégorie facultative, cohérent avec
// categorie_id nullable côté backend).
//
// Utilisé par : App.jsx
// Utilise : rien de spécial, juste les listes comptes/categories
// passées en props pour remplir les <select>.

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

  return (
    <form onSubmit={gererEnvoi}>
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

      <label htmlFor="libelleTransaction">Libellé</label>
      <input
        id="libelleTransaction"
        type="text"
        value={libelle}
        onChange={(event) => setLibelle(event.target.value)}
        required
      />

      <label htmlFor="montantTransaction">Montant</label>
      <input
        id="montantTransaction"
        type="number"
        step="0.01"
        value={montant}
        onChange={(event) => setMontant(event.target.value)}
        required
      />

      <label htmlFor="dateTransaction">Date</label>
      <input
        id="dateTransaction"
        type="date"
        value={dateTransaction}
        onChange={(event) => setDateTransaction(event.target.value)}
        required
      />

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

      <button type="submit">Créer</button>
    </form>
  )
}

export default TransactionForm