import { useState } from "react"

// ============================================================
// FORMULAIRE DE SAISIE D'UNE OPÉRATION D'INVESTISSEMENT
// ============================================================
//
// Rôle : enregistrer un achat ou une vente d'actif sur un compte.
//
// Nécessite au moins un compte et un actif existants — sans eux
// les <select> seraient vides et le formulaire inutilisable.
//
// Utilisé par : pages/PageInvestissements.jsx

function OperationForm({ comptes, actifsFinanciers, onCreation }) {
  const [compteId, setCompteId] = useState("")
  const [actifFinancierId, setActifFinancierId] = useState("")
  const [typeOperation, setTypeOperation] = useState("achat")
  const [quantite, setQuantite] = useState("")
  const [prixUnitaire, setPrixUnitaire] = useState("")
  const [frais, setFrais] = useState("")
  const [dateOperation, setDateOperation] = useState("")

  async function gererEnvoi(event) {
    event.preventDefault()

    const creationReussie = await onCreation({
      compteId,
      actifFinancierId,
      typeOperation,
      quantite,
      prixUnitaire,
      frais: frais || 0,
      dateOperation,
    })

    if (creationReussie) {
      setQuantite("")
      setPrixUnitaire("")
      setFrais("")
      setDateOperation("")
    }
  }

  if (comptes.length === 0) {
    return (
      <p className="liste__vide">
        Créez d'abord un compte pour pouvoir enregistrer une opération.
      </p>
    )
  }

  if (actifsFinanciers.length === 0) {
    return (
      <p className="liste__vide">
        Aucun actif financier disponible. Un administrateur doit d'abord
        en ajouter au référentiel.
      </p>
    )
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor="compteOperation">Compte</label>
        <select
          id="compteOperation"
          value={compteId}
          onChange={(event) => setCompteId(event.target.value)}
          required
        >
          <option value="">Choisir un compte</option>
          {comptes.map((compte) => (
            <option key={compte.id} value={compte.id}>
              {compte.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="actifOperation">Actif</label>
        <select
          id="actifOperation"
          value={actifFinancierId}
          onChange={(event) => setActifFinancierId(event.target.value)}
          required
        >
          <option value="">Choisir un actif</option>
          {actifsFinanciers.map((actif) => (
            <option key={actif.id} value={actif.id}>
              {actif.symbole} — {actif.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="typeOperation">Type d'opération</label>
        <select
          id="typeOperation"
          value={typeOperation}
          onChange={(event) => setTypeOperation(event.target.value)}
          required
        >
          <option value="achat">Achat</option>
          <option value="vente">Vente</option>
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="quantiteOperation">Quantité</label>
        <input
          id="quantiteOperation"
          type="number"
          min="0.00000001"
          step="0.00000001"
          placeholder="10"
          value={quantite}
          onChange={(event) => setQuantite(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="prixUnitaireOperation">Prix unitaire (€)</label>
        <input
          id="prixUnitaireOperation"
          type="number"
          min="0"
          step="0.01"
          placeholder="42.50"
          value={prixUnitaire}
          onChange={(event) => setPrixUnitaire(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="fraisOperation">Frais (€)</label>
        <input
          id="fraisOperation"
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={frais}
          onChange={(event) => setFrais(event.target.value)}
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="dateOperation">Date</label>
        <input
          id="dateOperation"
          type="date"
          value={dateOperation}
          onChange={(event) => setDateOperation(event.target.value)}
          required
        />
      </div>

      <button type="submit" className="formulaire__bouton">
        Enregistrer l'opération
      </button>
    </form>
  )
}

export default OperationForm