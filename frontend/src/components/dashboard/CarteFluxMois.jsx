// ============================================================
// CARTE — FLUX DU MOIS
// ============================================================
//
// Rôle : entrées, sorties, épargne et taux d'épargne du mois
// en cours. Le taux d'épargne est l'indicateur clé absent de
// la plupart des apps grand public.
//
// Le mois est affiché explicitement : sans lui, des entrées à
// 0 € semblent absurdes alors qu'elles signifient simplement
// qu'aucun revenu n'est daté de ce mois-ci.
//
// Utilisé par : pages/PageDashboard.jsx
// Utilise : utils/finance.utils.js

import { formaterMontant, formaterPourcentage } from "../../utils/finance.utils.js"

const NOMS_MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function CarteFluxMois({ fluxDuMois, mois, annee }) {
  const { entrees, sorties, epargne, tauxEpargne } = fluxDuMois

  return (
    <div className="carte-flux">
      <span className="carte-flux__periode">
        {NOMS_MOIS[mois - 1]} {annee}
      </span>

      <div className="carte-flux__colonnes">
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
            Entrées − sorties · {formaterPourcentage(tauxEpargne)} des entrées
          </span>
        </div>
      </div>
    </div>
  )
}

export default CarteFluxMois