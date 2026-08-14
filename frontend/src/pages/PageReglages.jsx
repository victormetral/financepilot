// ============================================================
// PAGE — RÉGLAGES
// ============================================================
//
// Rôle : paramétrer l'affichage du coût d'opportunité — le
// désactiver, ajuster le taux de rendement et l'horizon.
//
// Ces réglages vivent dans localStorage (préférences d'affichage,
// pas données métier) et sont lus par TransactionList.jsx.
//
// Utilisé par : App.jsx (route /reglages)
// Utilise : hooks/useReglages.js, utils/finance.utils.js

import { useReglages } from "../hooks/useReglages.js"

import {
  calculerCoutOpportunite,
  formaterMontant,
} from "../utils/finance.utils.js"

// Montant témoin pour l'aperçu : parle plus qu'une formule.
const MONTANT_EXEMPLE = 50

function PageReglages() {
  const { reglages, modifierReglage } = useReglages()

  const valeurExemple = calculerCoutOpportunite(
    MONTANT_EXEMPLE,
    reglages.tauxRendement / 100,
    reglages.horizonAnnees
  )

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Réglages</h1>
        <p className="page__sous-titre">
          Personnalisez l'affichage de vos données.
        </p>
      </header>

      <section className="page__section">
        <h2>Coût d'opportunité</h2>

        <p className="page__note">
          Affiche sous chaque dépense ce que ce montant vaudrait s'il avait
          été investi. Utile pour mettre les petits achats récurrents en
          perspective — désactivable si l'information vous pèse plutôt
          qu'elle ne vous aide.
        </p>

        <div className="formulaire">
          <div className="formulaire__champ formulaire__champ--interrupteur">
            <label htmlFor="coutOpportuniteActif">
              <input
                id="coutOpportuniteActif"
                type="checkbox"
                checked={reglages.coutOpportuniteActif}
                onChange={(event) =>
                  modifierReglage("coutOpportuniteActif", event.target.checked)
                }
              />
              Afficher le coût d'opportunité
            </label>
          </div>

          <div className="formulaire__champ">
            <label htmlFor="tauxRendement">
              Taux de rendement annuel (%)
            </label>
            <input
              id="tauxRendement"
              type="number"
              min="0"
              max="30"
              step="0.5"
              value={reglages.tauxRendement}
              onChange={(event) =>
                modifierReglage("tauxRendement", Number(event.target.value))
              }
              disabled={!reglages.coutOpportuniteActif}
            />
            <span className="formulaire__aide">
              7 % correspond au rendement nominal long terme d'un ETF Monde.
              Après inflation, comptez plutôt 5 %.
            </span>
          </div>

          <div className="formulaire__champ">
            <label htmlFor="horizonAnnees">Horizon (années)</label>
            <input
              id="horizonAnnees"
              type="number"
              min="1"
              max="50"
              step="1"
              value={reglages.horizonAnnees}
              onChange={(event) =>
                modifierReglage("horizonAnnees", Number(event.target.value))
              }
              disabled={!reglages.coutOpportuniteActif}
            />
          </div>
        </div>

        {reglages.coutOpportuniteActif && (
          <p className="reglages__apercu">
            Aperçu : une dépense de {formaterMontant(MONTANT_EXEMPLE)}{" "}
            vaudrait <strong>{formaterMontant(valeurExemple)}</strong> dans{" "}
            {reglages.horizonAnnees} ans.
          </p>
        )}
      </section>
    </div>
  )
}

export default PageReglages