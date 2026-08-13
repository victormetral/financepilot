// ============================================================
// CARTE — PATRIMOINE NET
// ============================================================
//
// Rôle : niveau 1 de lecture du dashboard — le chiffre roi,
// avec le détail liquidités/portefeuille en niveau 2.
//
// Utilisé par : pages/PageDashboard.jsx
// Utilise : utils/finance.utils.js

import { formaterMontant } from "../../utils/finance.utils.js"

function CartePatrimoine({ patrimoineNet, liquidites, valeurPortefeuille }) {
  return (
    <div className="carte-patrimoine">
      <span className="carte-patrimoine__libelle">Patrimoine net</span>
      <span className="carte-patrimoine__montant chiffre">
        {formaterMontant(patrimoineNet)}
      </span>

      <div className="carte-patrimoine__detail">
        <div className="carte-patrimoine__ligne">
          <span>Liquidités</span>
          <span className="chiffre">{formaterMontant(liquidites)}</span>
        </div>
        <div className="carte-patrimoine__ligne">
          <span>Portefeuille</span>
          <span className="chiffre">{formaterMontant(valeurPortefeuille)}</span>
        </div>
      </div>

      {valeurPortefeuille > 0 && (
        <p className="carte-patrimoine__note">
          Portefeuille valorisé au prix de revient (coût d'achat), pas au
          cours du marché.
        </p>
      )}
    </div>
  )
}

export default CartePatrimoine