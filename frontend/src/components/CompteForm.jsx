import { useState } from "react"

const sousTypesParType = {
  courant: ["compte_courant"],
  epargne: [
    "livret_a",
    "ldds",
    "lep",
    "pel",
    "cel",
    "autre_epargne",
  ],
  investissement: [
    "pea",
    "assurance_vie",
    "cto",
    "crypto",
    "autre_investissement",
  ],
  credit: ["carte_credit"],
  pret: [
    "pret_immobilier",
    "pret_consommation",
    "autre_pret",
  ],
}

function CompteForm({ onCreation }) {
  const [nom, setNom] = useState("")
  const [typeCompte, setTypeCompte] = useState("")
  // 🟨 CORRIGÉ : obligatoire pour le backend.
  const [sousTypeCompte, setSousTypeCompte] = useState("")

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({
      nom,
      typeCompte,
      sousTypeCompte,
    })

    if (creationReussie) {
      setNom("")
      setTypeCompte("")
      setSousTypeCompte("")
    }
  }

  function gererChangementType(event) {
    setTypeCompte(event.target.value)
    setSousTypeCompte("")
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
      <select
        id="typeCompte"
        value={typeCompte}
        onChange={gererChangementType}
        required
      >
        <option value="">Choisir un type</option>
        <option value="courant">Compte courant</option>
        <option value="epargne">Épargne</option>
        <option value="investissement">Investissement</option>
        <option value="credit">Crédit</option>
        <option value="pret">Prêt</option>
      </select>

      <label htmlFor="sousTypeCompte">Sous-type du compte</label>
      <select
        id="sousTypeCompte"
        value={sousTypeCompte}
        onChange={(event) => setSousTypeCompte(event.target.value)}
        disabled={!typeCompte}
        required
      >
        <option value="">Choisir un sous-type</option>
        {typeCompte &&
          sousTypesParType[typeCompte].map((sousType) => (
            <option key={sousType} value={sousType}>
              {sousType.replaceAll("_", " ")}
            </option>
          ))}
      </select>

      <button type="submit">Ajouter le compte</button>
    </form>
  )
}

export default CompteForm