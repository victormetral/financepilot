import { useState } from "react"

import { DEVISES, DEVISE_PAR_DEFAUT } from "../constants/devise.constants.js"

// ============================================================
// FORMULAIRE DE CRÉATION D'UN ACTIF FINANCIER
// ============================================================
//
// Rôle : ajouter une ligne au référentiel d'actifs (AAPL, CW8…).
//
// Réservé aux administrateurs : le backend renvoie 403 pour un
// utilisateur standard.
//
// La contrainte d'unicité en base porte sur (symbole, devise) :
// un même titre coté en EUR et en USD est légitime. Mais un
// symbole identique avec un type différent est presque toujours
// une erreur de saisie — d'où l'avertissement, qui informe sans
// bloquer.
//
// Utilisé par : pages/PageInvestissements.jsx

const TYPES_ACTIF = [
  { valeur: "action", libelle: "Action" },
  { valeur: "etf", libelle: "ETF" },
  { valeur: "crypto", libelle: "Cryptomonnaie" },
  { valeur: "obligation", libelle: "Obligation" },
  { valeur: "fonds", libelle: "Fonds" },
  { valeur: "immobilier", libelle: "Immobilier" },
  { valeur: "autre", libelle: "Autre" },
]

const LIBELLES_TYPE = {
  action: "Action",
  etf: "ETF",
  crypto: "Cryptomonnaie",
  obligation: "Obligation",
  fonds: "Fonds",
  immobilier: "Immobilier",
  autre: "Autre",
}

function ActifFinancierForm({ actifsFinanciers, onCreation }) {
  const [symbole, setSymbole] = useState("")
  const [nom, setNom] = useState("")
  const [typeActif, setTypeActif] = useState("etf")
  const [devise, setDevise] = useState(DEVISE_PAR_DEFAUT)

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({ symbole, nom, typeActif, devise })

    if (creationReussie) {
      setSymbole("")
      setNom("")
      setTypeActif("etf")
      setDevise(DEVISE_PAR_DEFAUT)
    }
  }

  const symboleNormalise = symbole.trim().toUpperCase()

  const actifExistant = symboleNormalise
    ? actifsFinanciers.find((actif) => actif.symbole === symboleNormalise)
    : null

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor="symboleActif">Symbole</label>
        <input
          id="symboleActif"
          type="text"
          placeholder="CW8, AAPL, BTC…"
          value={symbole}
          onChange={(event) => setSymbole(event.target.value)}
          required
        />
        {actifExistant && (
          <span className="formulaire__avertissement">
            {actifExistant.symbole} existe déjà : {actifExistant.nom} (
            {LIBELLES_TYPE[actifExistant.type_actif]} · {actifExistant.devise}).
            Continuez seulement s'il s'agit d'une autre cotation.
          </span>
        )}
      </div>

      <div className="formulaire__champ">
        <label htmlFor="nomActif">Nom</label>
        <input
          id="nomActif"
          type="text"
          placeholder="Amundi MSCI World, Apple Inc.…"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="typeActif">Type</label>
        <select
          id="typeActif"
          value={typeActif}
          onChange={(event) => setTypeActif(event.target.value)}
          required
        >
          {TYPES_ACTIF.map((type) => (
            <option key={type.valeur} value={type.valeur}>
              {type.libelle}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="deviseActif">Devise</label>
        <select
          id="deviseActif"
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
        Ajouter l'actif
      </button>
    </form>
  )
}

export default ActifFinancierForm