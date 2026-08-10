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

    onModification(categorie.id, {
      nom,
      typeCategorie,
    })
  }

  return (
    <form onSubmit={gererEnvoi}>
      <label htmlFor={`nomCategorieModifiee-${categorie.id}`}>
        Nom
      </label>
      <input
        id={`nomCategorieModifiee-${categorie.id}`}
        type="text"
        value={nom}
        onChange={(event) => setNom(event.target.value)}
        required
      />

      <label htmlFor={`typeCategorieModifiee-${categorie.id}`}>
        Type
      </label>
      <input
        id={`typeCategorieModifiee-${categorie.id}`}
        type="text"
        value={typeCategorie}
        onChange={(event) => setTypeCategorie(event.target.value)}
        required
      />

      <button type="submit">Enregistrer</button>
      <button type="button" onClick={onAnnulation}>
        Annuler
      </button>
    </form>
  )
}

export default CategorieEditForm