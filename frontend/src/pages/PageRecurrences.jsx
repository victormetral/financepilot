// ============================================================
// PAGE — RÉCURRENCES
// ============================================================
//
// Rôle : programmer les transactions qui reviennent — loyer,
// salaire, abonnements — et laisser l'application les créer
// à échéance.
//
// Les données viennent de useOutletContext() et non de props :
// Layout.jsx transmet contexteRoutes à toutes les pages via
// <Outlet context={...} />, ce qui évite de faire descendre
// chaque donnée route par route.
//
// Utilisé par : App.jsx (route /recurrences)
// Utilise : components/RecurrenceForm.jsx,
//           components/RecurrenceList.jsx

import { useOutletContext } from "react-router-dom"

import RecurrenceForm from "../components/RecurrenceForm.jsx"
import RecurrenceList from "../components/RecurrenceList.jsx"

function PageRecurrences() {
  const {
    comptes,
    categories,
    recurrences,
    recurrenceEnModification,
    setRecurrenceEnModification,
    gererCreationRecurrence,
    gererModificationRecurrence,
    gererSuppressionRecurrence,
    message,
  } = useOutletContext()

  return (
    <div className="page">
      <header className="page__entete">
        <h1>Récurrences</h1>
        <p className="page__sous-titre">
          Saisissez une fois ce qui revient chaque mois.
        </p>
      </header>

      {message && <p className="page__message">{message}</p>}

      <section className="page__section">
        <h2>
          {recurrenceEnModification
            ? "Modifier la récurrence"
            : "Programmer une récurrence"}
        </h2>

        <p className="page__note">
          Les échéances passées sont créées automatiquement à
          l'ouverture de l'application. Rien n'est créé à l'avance :
          le solde ne reflète que des mouvements ayant eu lieu.
        </p>

        {/*
          La `key` est le levier de réinitialisation du
          formulaire. Quand on passe d'une récurrence à une
          autre, ou de la modification à la création, la clé
          change et React remonte le composant avec les bonnes
          valeurs initiales — sans effet de synchronisation.
        */}
        <RecurrenceForm
          key={recurrenceEnModification?.id ?? "creation"}
          comptes={comptes}
          categories={categories}
          recurrence={recurrenceEnModification}
          onCreation={gererCreationRecurrence}
          onModification={gererModificationRecurrence}
          onAnnulation={() => setRecurrenceEnModification(null)}
        />
      </section>

      <section className="page__section">
        <h2>Mes récurrences</h2>

        <RecurrenceList
          recurrences={recurrences}
          onDemarrerModification={setRecurrenceEnModification}
          onSuppression={gererSuppressionRecurrence}
        />
      </section>
    </div>
  )
}

export default PageRecurrences