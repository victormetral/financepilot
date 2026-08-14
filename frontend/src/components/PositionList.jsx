// ============================================================
// LISTE DES POSITIONS
// ============================================================
//
// Rôle : agrège les opérations en positions — une ligne par
// actif détenu, avec quantité nette et prix de revient unitaire.
//
// C'est la vue qu'attend un investisseur : "je détiens 12 parts
// de CW8 à 385 € de PRU", pas la liste chronologique de ses
// 40 achats.
//
// Utilisé par : pages/PageInvestissements.jsx
// Utilise : utils/finance.utils.js

import {
  calculerPositionActif,
  formaterMontant,
} from "../utils/finance.utils.js"

function PositionList({ operations, actifsFinanciers }) {
  if (operations.length === 0) {
    return <p className="liste__vide">Aucune opération enregistrée.</p>
  }

  // Regroupement des opérations par actif, puis calcul du PRU
  // et de la quantité nette pour chacun.
  const positionsParActif = new Map()

  for (const operation of operations) {
    const identifiant = operation.actif_financier_id
    const liste = positionsParActif.get(identifiant) ?? []

    liste.push(operation)
    positionsParActif.set(identifiant, liste)
  }

  const positions = []

  for (const [actifId, operationsActif] of positionsParActif.entries()) {
    const position = calculerPositionActif(operationsActif)

    // Une position entièrement vendue n'a plus lieu d'être affichée.
    if (position.quantiteNette <= 0) {
      continue
    }

    const actif = actifsFinanciers.find((element) => element.id === actifId)

    positions.push({
      actifId,
      symbole: actif?.symbole ?? operationsActif[0].symbole_actif ?? "—",
      nom: actif?.nom ?? operationsActif[0].nom_actif ?? "Actif inconnu",
      ...position,
    })
  }

  if (positions.length === 0) {
    return (
      <p className="liste__vide">
        Aucune position ouverte — tous les actifs ont été revendus.
      </p>
    )
  }

  return (
    <ul className="liste">
      {positions.map((position) => (
        <li key={position.actifId} className="liste__element">
          <div className="liste__contenu">
            <span className="liste__titre">
              {position.symbole} — {position.nom}
            </span>
            <span className="liste__detail">
              {position.quantiteNette} × {formaterMontant(position.pru)} de PRU
            </span>
          </div>

          <span className="chiffre position__valeur">
            {formaterMontant(position.valeur)}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default PositionList