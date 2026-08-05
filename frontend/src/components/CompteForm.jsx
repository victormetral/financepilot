// ============================================================
// FORMULAIRE DE CRÉATION D'UN COMPTE BANCAIRE
// ============================================================
//
// Rôle : récupérer le nom et le type du nouveau compte.
// Utilisé par : App.jsx.

import { useState } from "react"

function CompteForm({ onCreation }) {
  const [nom, setNom] = useState("")
  const [typeCompte, setTypeCompte] = useState("")

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({
      nom,
      typeCompte
    })

    if (creationReussie) {
      setNom("")
      setTypeCompte("")
    }
  }

  return (
    <form onSubmit={gererEnvoi}>
      <label htmlFor="nomCompte">Nom du compte</label>
      <input
        id="nomCompte"
        type="text"
        value={nom}
        onChange={(event) => setNom(event.target.value)}
        required
      />

      <label htmlFor="typeCompte">Type du compte</label>
      <input
        id="typeCompte"
        type="text"
        value={typeCompte}
        onChange={(event) =>
          setTypeCompte(event.target.value)
        }
        required
      />

      <button type="submit">Ajouter le compte</button>
    </form>
  )
}

export default CompteForm
