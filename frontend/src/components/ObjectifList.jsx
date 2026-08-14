import ObjectifEditForm from "./ObjectifEditForm.jsx"

import {
  formaterMontant,
  formaterMoisAnnee,
  projeterAtteinteObjectif,
} from "../utils/finance.utils.js"

// ============================================================
// LISTE DES OBJECTIFS
// ============================================================
//
// Rôle : affiche chaque objectif avec sa barre de progression
// et, quand c'est possible, une projection d'atteinte au rythme
// d'épargne mensuel constaté.
//
// epargneMensuelle vient du tableau de bord (flux du mois) :
// c'est le rythme réel, pas une valeur saisie à la main.
//
// Utilisé par : pages/PageObjectifs.jsx
// Utilise : ObjectifEditForm.jsx, utils/finance.utils.js

const LIBELLES_STATUT = {
  "en cours": "En cours",
  atteint: "Atteint",
  abandonne: "Abandonné",
}

function ObjectifList({
  objectifs,
  epargneMensuelle,
  objectifEnModification,
  onDemarrerModification,
  onModification,
  onAnnulation,
  onSuppression,
}) {
  if (objectifs.length === 0) {
    return <p className="liste__vide">Aucun objectif défini.</p>
  }

  return (
    <ul className="liste">
      {objectifs.map((objectif) => {
        if (objectifEnModification === objectif.id) {
          return (
            <li key={objectif.id} className="liste__element">
              <ObjectifEditForm
                objectif={objectif}
                onModification={onModification}
                onAnnulation={onAnnulation}
              />
            </li>
          )
        }

        const actuel = Number(objectif.montant_actuel)
        const cible = Number(objectif.montant_cible)
        const proportion = cible > 0 ? Math.min(actuel / cible, 1) : 0

        const projection = projeterAtteinteObjectif(actuel, cible, epargneMensuelle)

        return (
          <li key={objectif.id} className="objectif">
            <div className="objectif__entete">
              <div className="liste__contenu">
                <span className="liste__titre">{objectif.nom}</span>
                <span className="liste__detail">
                  {formaterMontant(actuel)} sur {formaterMontant(cible)} ·{" "}
                  {LIBELLES_STATUT[objectif.statut]}
                </span>
              </div>

              <div className="liste__actions">
                <button
                  type="button"
                  className="bouton-secondaire"
                  onClick={() => onDemarrerModification(objectif.id)}
                >
                  Modifier
                </button>

                <button
                  type="button"
                  className="bouton-danger"
                  onClick={() => onSuppression(objectif.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>

            <div className="objectif__barre">
              <div
                className="objectif__progression"
                style={{ width: `${proportion * 100}%` }}
                data-atteint={projection.atteint}
              />
            </div>

            <div className="objectif__pied">
              <span>{Math.round(proportion * 100)} % atteint</span>

              {projection.atteint && (
                <span className="objectif__projection objectif__projection--atteint">
                  Objectif atteint
                </span>
              )}

              {!projection.atteint && projection.dateEstimee && (
                <span className="objectif__projection">
                  À ce rythme : {formaterMoisAnnee(projection.dateEstimee)}
                </span>
              )}

              {!projection.atteint && !projection.dateEstimee && (
                <span className="objectif__projection objectif__projection--alerte">
                  Épargne insuffisante ce mois-ci pour projeter une date
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default ObjectifList