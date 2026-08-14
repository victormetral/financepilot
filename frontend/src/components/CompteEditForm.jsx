import { useState } from "react"

import { DEVISES } from "../constants/devise.constants.js"

// ============================================================
// FORMULAIRE DE MODIFICATION D'UN COMPTE
// ============================================================
//
// Rôle : le PUT backend exige tous les champs métier ensemble.
// Utilisé par : CompteList.jsx

const SOUS_TYPES_PAR_TYPE = {
  courant: ["compte_courant"],
  epargne: ["livret_a", "ldds", "lep", "pel", "cel", "autre_epargne"],
  investissement: ["pea", "assurance_vie", "cto", "crypto", "autre_investissement"],
  credit: ["carte_credit"],
  pret: ["pret_immobilier", "pret_consommation", "autre_pret"],
}

function formaterSousType(sousType) {
  const texte = sousType.replaceAll("_", " ")

  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

function CompteEditForm({ compte, onModification, onAnnulation }) {
  const [nom, setNom] = useState(compte.nom)
  const [typeCompte, setTypeCompte] = useState(compte.type_compte)
  const [sousTypeCompte, setSousTypeCompte] = useState(compte.sous_type_compte)
  const [soldeInitial, setSoldeInitial] = useState(compte.solde_initial)
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
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor={`nomCompteModifie-${compte.id}`}>Nom</label>
        <input
          id={`nomCompteModifie-${compte.id}`}
          type="text"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`typeCompteModifie-${compte.id}`}>Type</label>
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
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`sousTypeCompteModifie-${compte.id}`}>Sous-type</label>
        <select
          id={`sousTypeCompteModifie-${compte.id}`}
          value={sousTypeCompte}
          onChange={(event) => setSousTypeCompte(event.target.value)}
          required
        >
          <option value="">Choisir un sous-type</option>
          {SOUS_TYPES_PAR_TYPE[typeCompte].map((sousType) => (
            <option key={sousType} value={sousType}>
              {formaterSousType(sousType)}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`soldeCompteModifie-${compte.id}`}>Solde initial</label>
        <input
          id={`soldeCompteModifie-${compte.id}`}
          type="number"
          step="0.01"
          value={soldeInitial}
          onChange={(event) => setSoldeInitial(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`deviseCompteModifie-${compte.id}`}>Devise</label>
        <select
          id={`deviseCompteModifie-${compte.id}`}
          value={devise}
          onChange={(event) => setDevise(event.target.value)}
          required
        >
          {DEVISES.map((deviseOption) => (
            <option key={deviseOption.code} value={deviseOption.code}>
              {deviseOption.libelle}
            </option>
          ))}
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

export default CompteEditForm