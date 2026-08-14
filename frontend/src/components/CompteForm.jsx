import { useState } from "react"

import { DEVISES, DEVISE_PAR_DEFAUT } from "../constants/devise.constants.js"

// ============================================================
// FORMULAIRE DE CRÉATION D'UN COMPTE
// ============================================================
//
// Rôle : saisir un nouveau compte bancaire. Le sous-type dépend
// du type choisi — la liste se met à jour dynamiquement.
//
// Le nom reste libre (c'est votre vocabulaire : "Le magot",
// "Retraite"…), mais type, sous-type et devise sont des listes
// fermées : ce sont des données structurantes, pas des étiquettes.
//
// Utilisé par : pages/PageComptes.jsx

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

function CompteForm({ onCreation }) {
  const [nom, setNom] = useState("")
  const [typeCompte, setTypeCompte] = useState("")
  const [sousTypeCompte, setSousTypeCompte] = useState("")
  const [soldeInitial, setSoldeInitial] = useState("")
  const [devise, setDevise] = useState(DEVISE_PAR_DEFAUT)

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({
      nom,
      typeCompte,
      sousTypeCompte,
      soldeInitial: soldeInitial || 0,
      devise,
    })

    if (creationReussie) {
      setNom("")
      setTypeCompte("")
      setSousTypeCompte("")
      setSoldeInitial("")
      setDevise(DEVISE_PAR_DEFAUT)
    }
  }

  // Changer de type invalide le sous-type précédemment choisi.
  function gererChangementType(event) {
    setTypeCompte(event.target.value)
    setSousTypeCompte("")
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor="nomCompte">Nom</label>
        <input
          id="nomCompte"
          type="text"
          placeholder="Compte courant, Livret A…"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="typeCompte">Type</label>
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
      </div>

      <div className="formulaire__champ">
        <label htmlFor="sousTypeCompte">Sous-type</label>
        <select
          id="sousTypeCompte"
          value={sousTypeCompte}
          onChange={(event) => setSousTypeCompte(event.target.value)}
          disabled={!typeCompte}
          required
        >
          <option value="">
            {typeCompte ? "Choisir un sous-type" : "Choisir un type d'abord"}
          </option>
          {typeCompte &&
            SOUS_TYPES_PAR_TYPE[typeCompte].map((sousType) => (
              <option key={sousType} value={sousType}>
                {formaterSousType(sousType)}
              </option>
            ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="soldeInitialCompte">Solde initial</label>
        <input
          id="soldeInitialCompte"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={soldeInitial}
          onChange={(event) => setSoldeInitial(event.target.value)}
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="deviseCompte">Devise</label>
        <select
          id="deviseCompte"
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

      <button type="submit" className="formulaire__bouton">
        Ajouter le compte
      </button>
    </form>
  )
}

export default CompteForm