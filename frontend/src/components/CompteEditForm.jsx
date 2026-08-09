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

function CompteEditForm({
  compte,
  onModification,
  onAnnulation,
}) {
  const [nom, setNom] = useState(compte.nom)
  const [typeCompte, setTypeCompte] = useState(compte.type_compte)
  // 🟨 CORRIGÉ : PUT exige aussi ce champ.
  const [sousTypeCompte, setSousTypeCompte] = useState(
    compte.sous_type_compte
  )
  const [soldeInitial, setSoldeInitial] = useState(
    compte.solde_initial
  )
  const [devise, setDevise] = useState(compte.devise)

  function gererEnvoi(event) {
    event.preventDefault()

    onModification(compte.id, {
      nom,
      typeCompte,
      sousTypeCompte,
      soldeInitial,
      devise,
    })
  }

  function gererChangementType(event) {
    setTypeCompte(event.target.value)
    setSousTypeCompte("")
  }

  return (
    <form onSubmit={gererEnvoi}>
      <label htmlFor={`nomCompteModifie-${compte.id}`}>
        Nom
      </label>
      <input
        id={`nomCompteModifie-${compte.id}`}
        type="text"
        value={nom}
        onChange={(event) => setNom(event.target.value)}
        required
      />

      <label htmlFor={`typeCompteModifie-${compte.id}`}>
        Type
      </label>
      <select
        id={`typeCompteModifie-${compte.id}`}
        value={typeCompte}
        onChange={gererChangementType}
        required
      >
        <option value="courant">Compte courant</option>
        <option value="epargne">Épargne</option>
        <option value="investissement">Investissement</option>
        <option value="credit">Crédit</option>
        <option value="pret">Prêt</option>
      </select>

      <label htmlFor={`sousTypeCompteModifie-${compte.id}`}>
        Sous-type
      </label>
      <select
        id={`sousTypeCompteModifie-${compte.id}`}
        value={sousTypeCompte}
        onChange={(event) => setSousTypeCompte(event.target.value)}
        required
      >
        <option value="">Choisir un sous-type</option>
        {sousTypesParType[typeCompte].map((sousType) => (
          <option key={sousType} value={sousType}>
            {sousType.replaceAll("_", " ")}
          </option>
        ))}
      </select>

      <label htmlFor={`soldeCompteModifie-${compte.id}`}>
        Solde initial
      </label>
      <input
        id={`soldeCompteModifie-${compte.id}`}
        type="number"
        step="0.01"
        value={soldeInitial}
        onChange={(event) => setSoldeInitial(event.target.value)}
        required
      />

      <label htmlFor={`deviseCompteModifie-${compte.id}`}>
        Devise
      </label>
      <input
        id={`deviseCompteModifie-${compte.id}`}
        type="text"
        value={devise}
        onChange={(event) => setDevise(event.target.value)}
        required
      />

      <button type="submit">Enregistrer</button>
      <button type="button" onClick={onAnnulation}>
        Annuler
      </button>
    </form>
  )
}

export default CompteEditForm