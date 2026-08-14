// ============================================================
// SAISIE EXPRESS D'UNE TRANSACTION
// ============================================================
//
// Rôle : créer une transaction depuis un champ unique,
// avec un aperçu de l'interprétation avant validation.
// Utilisé par : la page Transactions.
// Utilise : saisieExpress.utils.js (analyse de la phrase).
//
// L'aperçu est le cœur du dispositif : l'utilisateur corrige
// avant l'envoi, jamais après. Sans lui, une interprétation
// erronée créerait une transaction fausse en silence.

import { useState } from "react"

import { analyserSaisieExpress } from "../utils/saisieExpress.utils.js"

// ============================================================
// 1. MÉMORISATION DU COMPTE CHOISI
// ============================================================

/*
  Le compte n'est pas déductible de la phrase saisie.
  Il est donc choisi dans un sélecteur, dont la valeur est
  conservée d'une session à l'autre : on saisit presque
  toujours sur le même compte au quotidien.
*/
const CLE_COMPTE_MEMORISE = "financepilot.saisieExpress.compteId"

const lireCompteMemorise = () => {
  return localStorage.getItem(CLE_COMPTE_MEMORISE) ?? ""
}

/*
  Renvoie le compte à afficher réellement dans le sélecteur.

  Le compte mémorisé peut avoir été supprimé depuis la dernière
  session : dans ce cas le premier compte disponible prend le
  relais. Cette valeur est calculée pendant le rendu plutôt que
  corrigée dans un effet, ce qui éviterait un rendu en cascade.
*/
const choisirCompteAffiche = (compteMemorise, comptes) => {
  const compteExiste = comptes.some(
    (compte) => String(compte.id) === compteMemorise
  )

  if (compteExiste) {
    return compteMemorise
  }

  return comptes.length > 0 ? String(comptes[0].id) : ""
}

// ============================================================
// 2. COMPOSANT
// ============================================================

function SaisieExpress({ comptes, categories, onCreation }) {
  const [texte, setTexte] = useState("")
  const [compteMemorise, setCompteMemorise] =
    useState(lireCompteMemorise)

  const compteId = choisirCompteAffiche(compteMemorise, comptes)

  // Analyse à chaque frappe : l'aperçu suit la saisie.
  const analyse = analyserSaisieExpress(texte, categories)

  /*
    L'écriture dans localStorage a lieu ici, au moment du choix
    de l'utilisateur : c'est une action, pas une synchronisation
    d'état, donc sa place est dans le gestionnaire.
  */
  function gererChangementCompte(event) {
    const nouveauCompteId = event.target.value

    setCompteMemorise(nouveauCompteId)
    localStorage.setItem(CLE_COMPTE_MEMORISE, nouveauCompteId)
  }

  async function gererEnvoi(event) {
    event.preventDefault()

    if (!analyse.estValide || compteId === "") {
      return
    }

    const creationReussie = await onCreation({
      compteId,
      categorieId: analyse.donnees.categorieId,
      libelle: analyse.donnees.libelle,
      montant: analyse.donnees.montant,
      dateTransaction: analyse.donnees.dateTransaction,
      typeTransaction: analyse.donnees.typeTransaction,
    })

    // Le champ ne se vide qu'en cas de succès, pour ne pas
    // perdre la saisie si le backend refuse.
    if (creationReussie) {
      setTexte("")
    }
  }

  if (comptes.length === 0) {
    return (
      <p>
        Crée d'abord un compte pour utiliser la saisie express.
      </p>
    )
  }

  return (
    <form className="formulaire" onSubmit={gererEnvoi}>
      <h3>Saisie express</h3>

      <label htmlFor="compteSaisieExpress">Compte</label>
      <select
        id="compteSaisieExpress"
        value={compteId}
        onChange={gererChangementCompte}
      >
        {comptes.map((compte) => (
          <option key={compte.id} value={compte.id}>
            {compte.nom}
          </option>
        ))}
      </select>

      <label htmlFor="texteSaisieExpress">
        Montant et libellé
      </label>
      <input
        id="texteSaisieExpress"
        type="text"
        placeholder="45 courses carrefour"
        value={texte}
        onChange={(event) => setTexte(event.target.value)}
      />

      {/* Aperçu : visible seulement quand on a commencé à taper */}
      {texte.trim() !== "" && (
        <p>
          {analyse.estValide ? (
            <>
              <strong>
                {analyse.donnees.typeTransaction === "revenu"
                  ? "Revenu"
                  : "Dépense"}
                {" de "}
                {analyse.donnees.montant.toFixed(2)} €
              </strong>
              {" — "}
              {analyse.donnees.libelle}
              {" — "}
              {analyse.donnees.nomCategorie ?? "sans catégorie"}
            </>
          ) : (
            analyse.message
          )}
        </p>
      )}

      <button type="submit" disabled={!analyse.estValide}>
        Ajouter
      </button>
    </form>
  )
}

export default SaisieExpress