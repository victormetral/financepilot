import { useState } from "react"

/*
  FORMULAIRE DE MODIFICATION D'UN BUDGET

  Le PUT backend exige les quatre champs métier.
  La catégorie, la limite et la période sont donc renvoyées ensemble.
*/

function BudgetEditForm({
  budget,
  categories,
  onModification,
  onAnnulation,
}) {
  const [categorieId, setCategorieId] = useState(
    budget.categorie_id
  )
  const [montantLimite, setMontantLimite] = useState(
    budget.montant_limite
  )
  const [mois, setMois] = useState(budget.mois)
  const [annee, setAnnee] = useState(budget.annee)

  function gererEnvoi(event) {
    event.preventDefault()

    onModification(budget.id, {
      categorieId,
      montantLimite,
      mois,
      annee,
    })
  }

  return (
    <form onSubmit={gererEnvoi}>
      <label htmlFor={`categorieBudgetModifie-${budget.id}`}>
        Catégorie
      </label>
      <select
        id={`categorieBudgetModifie-${budget.id}`}
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

      <label htmlFor={`montantBudgetModifie-${budget.id}`}>
        Montant limite
      </label>
      <input
        id={`montantBudgetModifie-${budget.id}`}
        type="number"
        min="0.01"
        step="0.01"
        value={montantLimite}
        onChange={(event) => setMontantLimite(event.target.value)}
        required
      />

      <label htmlFor={`moisBudgetModifie-${budget.id}`}>
        Mois
      </label>
      <input
        id={`moisBudgetModifie-${budget.id}`}
        type="number"
        min="1"
        max="12"
        value={mois}
        onChange={(event) => setMois(event.target.value)}
        required
      />

      <label htmlFor={`anneeBudgetModifie-${budget.id}`}>
        Année
      </label>
      <input
        id={`anneeBudgetModifie-${budget.id}`}
        type="number"
        min="2000"
        max="2100"
        value={annee}
        onChange={(event) => setAnnee(event.target.value)}
        required
      />

      <button type="submit">Enregistrer</button>
      <button type="button" onClick={onAnnulation}>
        Annuler
      </button>
    </form>
  )
}

export default BudgetEditForm