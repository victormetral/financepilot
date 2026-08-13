import { useState } from "react"

// ============================================================
// FORMULAIRE DE MODIFICATION D'UNE CATÉGORIE
// ============================================================
//
// Rôle : le PUT backend exige nom et type_categorie ensemble.
// Utilisé par : CategorieList.jsx

function CategorieEditForm({ categorie, onModification, onAnnulation }) {
  const [nom, setNom] = useState(categorie.nom)
  const [typeCategorie, setTypeCategorie] = useState(categorie.type_categorie)

  function gererEnvoi(event) {
    event.preventDefault()

    onModification(categorie.id, { nom, typeCategorie })
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor={`nomCategorieModifiee-${categorie.id}`}>Nom</label>
        <input
          id={`nomCategorieModifiee-${categorie.id}`}
          type="text"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`typeCategorieModifiee-${categorie.id}`}>Nature</label>
        <select
          id={`typeCategorieModifiee-${categorie.id}`}
          value={typeCategorie}
          onChange={(event) => setTypeCategorie(event.target.value)}
          required
        >
          <option value="depense">Dépense</option>
          <option value="revenu">Revenu</option>
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

export default CategorieEditForm