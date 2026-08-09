import { useState } from "react"

function CategorieForm({ onCreation }) {
  const [nom, setNom] = useState("")
  const [typeCategorie, setTypeCategorie] = useState("")

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({
      nom,
      typeCategorie,
    })

    if (creationReussie) {
      setNom("")
      setTypeCategorie("")
    }
  }

  return (
    <form onSubmit={gererEnvoi}>
      <label htmlFor="nomCategorie">
        Nom de la catégorie
      </label>
      <input
        id="nomCategorie"
        type="text"
        value={nom}
        onChange={(event) => setNom(event.target.value)}
        required
      />

      <label htmlFor="typeCategorie">
        Type de la catégorie
      </label>
      <input
        id="typeCategorie"
        type="text"
        value={typeCategorie}
        onChange={(event) =>
          setTypeCategorie(event.target.value)
        }
        required
      />

      <button type="submit">
        Ajouter la catégorie
      </button>
    </form>
  )
}

export default CategorieForm