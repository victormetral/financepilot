// ============================================================
// CARTE — FLUX DU MOIS
// ============================================================
//
// Rôle : entrées, sorties, épargne et taux d'épargne du mois
// en cours. Le taux d'épargne est l'indicateur clé absent de
// la plupart des apps grand public.
//
// Utilisé par : pages/PageDashboard.jsx
// Utilise : utils/finance.utils.js

import { formaterMontant, formaterPourcentage } from "../../utils/finance.utils.js"

function CarteFluxMois({ fluxDuMois }) {
  const { entrees, sorties, epargne, tauxEpargne } = fluxDuMois

  return (
    <div className="carte-flux">
      <div className="carte-flux__colonne">
        <span className="carte-flux__libelle">Entrées</span>
        <span className="carte-flux__montant carte-flux__montant--positif chiffre">
          {formaterMontant(entrees)}
        </span>
      </div>

      <div className="carte-flux__colonne">
        <span className="carte-flux__libelle">Sorties</span>
        <span className="carte-flux__montant carte-flux__montant--negatif chiffre">
          {formaterMontant(sorties)}
        </span>
      </div>

      <div className="carte-flux__colonne">
        <span className="carte-flux__libelle">Épargne</span>
        <span className="carte-flux__montant chiffre">
          {formaterMontant(epargne)}
        </span>
        <span className="carte-flux__sous-texte">
          {formaterPourcentage(tauxEpargne)} des entrées
        </span>
      </div>
    </div>
  )
}

export default CarteFluxMois