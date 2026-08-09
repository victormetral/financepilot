import { useState } from "react"

function CompteEditForm({
  compte,
  onModification,
  onAnnulation,
}) {
  const [nom, setNom] = useState(compte.nom)
  const [typeCompte, setTypeCompte] = useState(compte.type_compte)
  // 🟨 CORRIGÉ
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
      <input
        id={`typeCompteModifie-${compte.id}`}
        type="text"
        value={typeCompte}
        onChange={(event) => setTypeCompte(event.target.value)}
        required
      />

      {/* 🟨 CORRIGÉ : PUT exige aussi ce champ */}
      <label htmlFor={`sousTypeCompteModifie-${compte.id}`}>
        Sous-type
      </label>
      <input
        id={`sousTypeCompteModifie-${compte.id}`}
        type="text"
        value={sousTypeCompte}
        onChange={(event) => setSousTypeCompte(event.target.value)}
        required
      />

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