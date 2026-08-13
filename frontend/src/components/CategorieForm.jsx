import { useState } from "react"

// ============================================================
// FORMULAIRE DE CRÉATION D'UNE CATÉGORIE
// ============================================================
//
// Rôle : saisir une nouvelle catégorie de dépense ou de revenu.
//
// La nature est un <select> et non un champ libre : le backend
// n'accepte que "depense" ou "revenu".
//
// Utilisé par : pages/PageCategories.jsx

function CategorieForm({ onCreation }) {
  const [nom, setNom] = useState("")
  const [typeCategorie, setTypeCategorie] = useState("depense")

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({ nom, typeCategorie })

    if (creationReussie) {
      setNom("")
      setTypeCategorie("depense")
    }
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor="nomCategorie">Nom</label>
        <input
          id="nomCategorie"
          type="text"
          placeholder="Courses, Loyer, Salaire…"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="typeCategorie">Nature</label>
        <select
          id="typeCategorie"
          value={typeCategorie}
          onChange={(event) => setTypeCategorie(event.target.value)}
          required
        >
          <option value="depense">Dépense</option>
          <option value="revenu">Revenu</option>
        </select>
      </div>

      <button type="submit" className="formulaire__bouton">
        Ajouter la catégorie
      </button>
    </form>
  )
}

export default CategorieForm