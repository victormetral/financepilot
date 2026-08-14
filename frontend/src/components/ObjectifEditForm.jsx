import { useState } from "react"

// ============================================================
// FORMULAIRE DE MODIFICATION D'UN OBJECTIF
// ============================================================
//
// Rôle : le PUT backend exige tous les champs métier ensemble.
// Utilisé par : ObjectifList.jsx

function ObjectifEditForm({ objectif, onModification, onAnnulation }) {
  const [nom, setNom] = useState(objectif.nom)
  const [montantCible, setMontantCible] = useState(objectif.montant_cible)
  const [montantActuel, setMontantActuel] = useState(objectif.montant_actuel)
  const [statut, setStatut] = useState(objectif.statut)

  // La date arrive en ISO complet depuis PostgreSQL : on ne garde
  // que la partie date pour l'input de type "date".
  const [dateEcheance, setDateEcheance] = useState(
    objectif.date_echeance ? String(objectif.date_echeance).split("T")[0] : ""
  )

  function gererEnvoi(event) {
    event.preventDefault()

    onModification(objectif.id, {
      nom,
      montantCible,
      montantActuel,
      dateEcheance,
      statut,
    })
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor={`nomObjectifModifie-${objectif.id}`}>Nom</label>
        <input
          id={`nomObjectifModifie-${objectif.id}`}
          type="text"
          value={nom}
          onChange={(event) => setNom(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`montantCibleModifie-${objectif.id}`}>
          Montant cible (€)
        </label>
        <input
          id={`montantCibleModifie-${objectif.id}`}
          type="number"
          min="0.01"
          step="0.01"
          value={montantCible}
          onChange={(event) => setMontantCible(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`montantActuelModifie-${objectif.id}`}>
          Déjà épargné (€)
        </label>
        <input
          id={`montantActuelModifie-${objectif.id}`}
          type="number"
          min="0"
          step="0.01"
          value={montantActuel}
          onChange={(event) => setMontantActuel(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`dateEcheanceModifie-${objectif.id}`}>
          Échéance
        </label>
        <input
          id={`dateEcheanceModifie-${objectif.id}`}
          type="date"
          value={dateEcheance}
          onChange={(event) => setDateEcheance(event.target.value)}
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor={`statutObjectifModifie-${objectif.id}`}>Statut</label>
        <select
          id={`statutObjectifModifie-${objectif.id}`}
          value={statut}
          onChange={(event) => setStatut(event.target.value)}
          required
        >
          <option value="en cours">En cours</option>
          <option value="atteint">Atteint</option>
          <option value="abandonne">Abandonné</option>
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

export default ObjectifEditForm