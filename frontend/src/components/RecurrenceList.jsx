// ============================================================
// LISTE DES RÉCURRENCES
// ============================================================
//
// Rôle : afficher les modèles programmés, avec leur rythme et
// leur prochaine échéance, et proposer modification et
// suppression.
//
// Utilisé par : pages/PageRecurrences.jsx
// Utilise : constants/recurrence.constants.js,
//           utils/finance.utils.js

import { decrireRythme } from "../constants/recurrence.constants.js"
import { formaterMontant } from "../utils/finance.utils.js"

/*
  Affiche une date "AAAA-MM-JJ" au format français.

  Le découpage manuel évite new Date() : sur une date sans
  heure, le navigateur applique un fuseau et peut afficher la
  veille. C'est le même piège que celui corrigé côté backend
  dans config/database.js.
*/
function formaterDate(texteDate) {
  if (!texteDate) {
    return "—"
  }

  const [annee, mois, jour] = texteDate.split("-")

  return `${jour}/${mois}/${annee}`
}

function RecurrenceList({
  recurrences,
  onDemarrerModification,
  onSuppression,
}) {
  if (recurrences.length === 0) {
    return (
      <p className="liste__vide">
        Aucune récurrence programmée. Le loyer, le salaire ou un
        abonnement sont de bons candidats.
      </p>
    )
  }

  return (
    <ul className="liste">
      {recurrences.map((recurrence) => (
        <li key={recurrence.id} className="liste__element">
          <div className="liste__contenu">
            <span className="liste__titre">
              {recurrence.libelle}
              {!recurrence.active && " · en pause"}
            </span>

            <span className="liste__detail">
              <span className="chiffre">
                {formaterMontant(Number(recurrence.montant))}
              </span>
              {" · "}
              {decrireRythme(recurrence.frequence, recurrence.intervalle)}
              {" · "}
              {recurrence.nom_compte}
              {recurrence.nom_categorie && ` · ${recurrence.nom_categorie}`}
            </span>

            {/*
              La prochaine échéance n'a de sens que si la
              récurrence tourne encore : en pause, la date
              affichée serait celle d'un rendez-vous qui
              n'aura pas lieu.
            */}
            <span className="liste__detail">
              {recurrence.active
                ? `Prochaine échéance : ${formaterDate(
                    recurrence.prochaine_occurrence
                  )}`
                : "Suspendue"}
              {recurrence.date_fin &&
                ` · jusqu'au ${formaterDate(recurrence.date_fin)}`}
            </span>
          </div>

          <div className="liste__actions">
            <button
              type="button"
              className="bouton-secondaire"
              onClick={() => onDemarrerModification(recurrence)}
            >
              Modifier
            </button>

            <button
              type="button"
              className="bouton-danger"
              onClick={() => onSuppression(recurrence.id)}
            >
              Supprimer
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default RecurrenceList