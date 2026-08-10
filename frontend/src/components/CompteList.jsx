/*
  LISTE DES COMPTES BANCAIRES

  Rôle général :
  afficher les comptes de l'utilisateur connecté et
  leurs boutons d'action (modifier / supprimer).

  Utilisé par :
  - App.jsx

  Utilise :
  - CompteEditForm.jsx (formulaire affiché en ligne
    quand un compte est en cours de modification)
*/

import CompteEditForm from "./CompteEditForm.jsx"

function CompteList({
  comptes,
  compteEnModification,
  onDemarrerModification,
  onModification,
  onAnnulation,
  onSuppression,
}) {
  // Cas simple : aucun compte à afficher.
  if (comptes.length === 0) {
    return <p>Aucun compte bancaire enregistré.</p>
  }

  // Cas général : un compte par ligne, avec son
  // formulaire d'édition affiché seulement si ce
  // compte est celui en cours de modification.
  return (
    <ul> 
      {comptes.map((compte) => (
        <li key={compte.id}>
          {compte.nom}
          {" — "}
          {compte.solde_initial}
          {" "}
          {compte.devise}

          <button
            type="button"
            onClick={() => onDemarrerModification(compte)}
          >
            Modifier
          </button>

          <button
            type="button"
            onClick={() => onSuppression(compte.id)}
          >
            Supprimer
          </button>

          {compteEnModification?.id === compte.id && (
            <CompteEditForm
              compte={compte}
              onModification={onModification}
              onAnnulation={onAnnulation}
            />
          )}
        </li>
      ))}
    </ul>
  )
}

export default CompteList