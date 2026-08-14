// ============================================================
// PAGE — INVESTISSEMENTS
// ============================================================
//
// Rôle : trois sections complémentaires —
// 1. Positions : ce que vous détenez actuellement (vue agrégée)
// 2. Opérations : historique des achats/ventes
// 3. Référentiel : les actifs disponibles (gestion admin)
//
// Utilisé par : App.jsx (route /investissements)

import { useOutletContext } from "react-router-dom"

import OperationForm from "../components/OperationForm.jsx"
import OperationList from "../components/OperationList.jsx"
import PositionList from "../components/PositionList.jsx"
import ActifFinancierForm from "../components/ActifFinancierForm.jsx"
import ActifFinancierList from "../components/ActifFinancierList.jsx"

function PageInvestissements() {
  const {
    comptes,
    actifsFinanciers,
    gererCreationActif,
    gererSuppressionActif,
    operationsInvestissement,
    gererCreationOperation,
    gererSuppressionOperation,
    message,
  } = useOutletContext()

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Investissements</h1>
        <p className="page__sous-titre">
          Suivez vos positions et enregistrez vos opérations.
        </p>
      </header>

      {message && <p className="page__message">{message}</p>}

      <section className="page__section">
        <h2>Vos positions</h2>
        <PositionList
          operations={operationsInvestissement}
          actifsFinanciers={actifsFinanciers}
        />
        <p className="page__note">
          Valorisées au prix de revient unitaire (méthode du coût moyen
          pondéré), pas au cours du marché.
        </p>
      </section>

      <section className="page__section">
        <h2>Enregistrer une opération</h2>
        <OperationForm
          comptes={comptes}
          actifsFinanciers={actifsFinanciers}
          onCreation={gererCreationOperation}
        />
      </section>

      <section className="page__section">
        <h2>Historique des opérations</h2>
        <OperationList
          operations={operationsInvestissement}
          onSuppression={gererSuppressionOperation}
        />
      </section>

      <section className="page__section">
        <h2>Référentiel d'actifs</h2>
        <ActifFinancierForm
          actifsFinanciers={actifsFinanciers}
          onCreation={gererCreationActif}
        />
        <ActifFinancierList
          actifsFinanciers={actifsFinanciers}
          onSuppression={gererSuppressionActif}
        />
        <p className="page__note">
          Le référentiel est partagé entre tous les utilisateurs : seuls les
          administrateurs peuvent le modifier.
        </p>
      </section>
    </div>
  )
}

export default PageInvestissements