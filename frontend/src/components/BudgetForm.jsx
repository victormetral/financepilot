import { useState } from "react"

// ============================================================
// FORMULAIRE DE CRÉATION D'UN BUDGET
// ============================================================
//
// Rôle : associer une catégorie, un montant limite et une
// période mensuelle.
//
// Mois et année sont des <select> plutôt que des champs
// numériques libres : saisir "13" ou "1999" n'a aucun sens et
// serait de toute façon refusé par le backend.
//
// Utilisé par : pages/PageBudgets.jsx

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function BudgetForm({ categories, onCreation }) {
  const dateActuelle = new Date()
  const anneeActuelle = dateActuelle.getFullYear()

  const [categorieId, setCategorieId] = useState("")
  const [montantLimite, setMontantLimite] = useState("")
  const [mois, setMois] = useState(dateActuelle.getMonth() + 1)
  const [annee, setAnnee] = useState(anneeActuelle)

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({
      categorieId,
      montantLimite,
      mois,
      annee,
    })

    if (creationReussie) {
      setCategorieId("")
      setMontantLimite("")
    }
  }

  if (categories.length === 0) {
    return (
      <p className="liste__vide">
        Créez d'abord une catégorie pour pouvoir lui associer un budget.
      </p>
    )
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
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
      </div>

      <div className="formulaire__champ">
        <label htmlFor="montantLimite">Montant limite (€)</label>
        <input
          id="montantLimite"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="500.00"
          value={montantLimite}
          onChange={(event) => setMontantLimite(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="moisBudget">Mois</label>
        <select
          id="moisBudget"
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
        <label htmlFor="anneeBudget">Année</label>
        <select
          id="anneeBudget"
          value={annee}
          onChange={(event) => setAnnee(event.target.value)}
          required
        >
          {[anneeActuelle - 1, anneeActuelle, anneeActuelle + 1].map(
            (anneeOption) => (
              <option key={anneeOption} value={anneeOption}>
                {anneeOption}
              </option>
            )
          )}
        </select>
      </div>

      <button type="submit" className="formulaire__bouton">
        Ajouter le budget
      </button>
    </form>
  )
}

export default BudgetForm