import { useState } from "react"

// ============================================================
// FORMULAIRE DE CRÉATION D'UN OBJECTIF
// ============================================================
//
// Rôle : saisir un objectif d'épargne (nom, montant cible,
// montant déjà épargné, échéance facultative).
//
// Le statut est un <select> : le backend n'accepte que
// "en cours", "atteint" ou "abandonne".
//
// Utilisé par : pages/PageObjectifs.jsx

function ObjectifForm({ onCreation }) {
  const [nom, setNom] = useState("")
  const [montantCible, setMontantCible] = useState("")
  const [montantActuel, setMontantActuel] = useState("")
  const [dateEcheance, setDateEcheance] = useState("")

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({
      nom,
      montantCible,
      montantActuel: montantActuel || 0,
      dateEcheance,
      statut: "en cours",
    })

    if (creationReussie) {
      setNom("")
      setMontantCible("")
      setMontantActuel("")
      setDateEcheance("")
    }
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor="nomObjectif">Nom</label>
        <input
          id="nomObjectif"
          type="text"
          placeholder="Épargne de précaution, Apport immobilier…"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="montantCibleObjectif">Montant cible (€)</label>
        <input
          id="montantCibleObjectif"
          type="number"
          min="0.01"
          step="0.01"
          placeholder="10000.00"
          value={montantCible}
          onChange={(event) => setMontantCible(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="montantActuelObjectif">Déjà épargné (€)</label>
        <input
          id="montantActuelObjectif"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={montantActuel}
          onChange={(event) => setMontantActuel(event.target.value)}
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="dateEcheanceObjectif">Échéance (facultatif)</label>
        <input
          id="dateEcheanceObjectif"
          type="date"
          value={dateEcheance}
          onChange={(event) => setDateEcheance(event.target.value)}
        />
      </div>

      <button type="submit" className="formulaire__bouton">
        Ajouter l'objectif
      </button>
    </form>
  )
}

export default ObjectifForm