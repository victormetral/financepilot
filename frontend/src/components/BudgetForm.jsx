import { useState } from "react"

/*
  FORMULAIRE DE CRÉATION D'UN BUDGET

  Un budget associe une catégorie, un montant limite
  et une période mensuelle.
*/

function BudgetForm({ categories, onCreation }) {
  const dateActuelle = new Date()

  const [categorieId, setCategorieId] = useState("")
  const [montantLimite, setMontantLimite] = useState("")
  const [mois, setMois] = useState(dateActuelle.getMonth() + 1)
  const [annee, setAnnee] = useState(dateActuelle.getFullYear())

  function gererEnvoi(event) {
    event.preventDefault()

    onCreation({
      categorieId,
      montantLimite,
      mois,
      annee,
    })
  }

  return (
    <form onSubmit={gererEnvoi}>
      <h3>Créer un budget</h3>

      <label htmlFor="categorieBudget">Catégorie</label>
      <select
        id="categorieBudget"
        value={categorieId}
        onChange={(event) => setCategorieId(event.target.value)}
        required
      >
        <option value="">Choisir une catégorie</option>
        {categories.map((categorie) => (
          <option key={categorie.id} value={categorie.id}>
            {categorie.nom}
          </option>
        ))}
      </select>

      <label htmlFor="montantLimite">Montant limite</label>
      <input
        id="montantLimite"
        type="number"
        min="0.01"
        step="0.01"
        value={montantLimite}
        onChange={(event) => setMontantLimite(event.target.value)}
        required
      />

      <label htmlFor="moisBudget">Mois</label>
      <input
        id="moisBudget"
        type="number"
        min="1"
        max="12"
        value={mois}
        onChange={(event) => setMois(event.target.value)}
        required
      />

      <label htmlFor="anneeBudget">Année</label>
      <input
        id="anneeBudget"
        type="number"
        min="2000"
        max="2100"
        value={annee}
        onChange={(event) => setAnnee(event.target.value)}
        required
      />

      <button type="submit">Ajouter le budget</button>
    </form>
  )
}

export default BudgetForm