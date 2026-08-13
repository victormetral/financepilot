import { useState } from "react"

// ============================================================
// FORMULAIRE DE MODIFICATION D'UN BUDGET
// ============================================================
//
// Rôle : le PUT backend exige les quatre champs métier ensemble.
// Utilisé par : BudgetList.jsx

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function BudgetEditForm({ budget, categories, onModification, onAnnulation }) {
  const [categorieId, setCategorieId] = useState(budget.categorie_id)
  const [montantLimite, setMontantLimite] = useState(budget.montant_limite)
  const [mois, setMois] = useState(budget.mois)
  const [annee, setAnnee] = useState(budget.annee)

  function gererEnvoi(event) {
    event.preventDefault()

    onModification(budget.id, { categorieId, montantLimite, mois, annee })
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor={`categorieBudgetModifie-${budget.id}`}>Catégorie</label>
        <select
          id={`categorieBudgetModifie-${budget.id}`}
          value={categorieId}
          onChange={(event) => setCategorieId(event.target.value)}
          required
        >
          {categories.map((categorie) => (
            <option key={categorie.id} value={categorie.id}>
              {categorie.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`montantBudgetModifie-${budget.id}`}>Montant limite (€)</label>
        <input
          id={`montantBudgetModifie-${budget.id}`}
          type="number"
          min="0.01"
          step="0.01"
          value={montantLimite}
          onChange={(event) => setMontantLimite(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`moisBudgetModifie-${budget.id}`}>Mois</label>
        <select
          id={`moisBudgetModifie-${budget.id}`}
          value={mois}
          onChange={(event) => setMois(event.target.value)}
          required
        >
          {NOMS_MOIS.map((nomMois, index) => (
            <option key={nomMois} value={index + 1}>
              {nomMois}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`anneeBudgetModifie-${budget.id}`}>Année</label>
        <input
          id={`anneeBudgetModifie-${budget.id}`}
          type="number"
          min="2000"
          max="2100"
          value={annee}
          onChange={(event) => setAnnee(event.target.value)}
          required
        />
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

export default BudgetEditForm