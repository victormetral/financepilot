import CompteEditForm from "./CompteEditForm.jsx"

// ============================================================
// LISTE DES COMPTES
// ============================================================
//
// Rôle : affiche les comptes avec leur type et leur solde.
// Un seul compte peut être en modification à la fois.
//
// Utilisé par : pages/PageComptes.jsx
// Utilise : CompteEditForm.jsx

const LIBELLES_TYPE = {
  courant: "Compte courant",
  epargne: "Épargne",
  investissement: "Investissement",
  credit: "Crédit",
  pret: "Prêt",
}

function formaterSousType(sousType) {
  const texte = String(sousType).replaceAll("_", " ")

  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

function formaterMontant(montant, devise) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: devise || "EUR",
  }).format(Number(montant))
}

function CompteList({
  comptes,
  compteEnModification,
  onDemarrerModification,
  onModification,
  onAnnulation,
  onSuppression,
}) {
  if (comptes.length === 0) {
    return <p className="liste__vide">Aucun compte bancaire enregistré.</p>
  }

  return (
    <ul className="liste">
      {comptes.map((compte) => (
        <li key={compte.id} className="liste__element">
          {compteEnModification === compte.id ? (
            <CompteEditForm
              compte={compte}
              onModification={onModification}
              onAnnulation={onAnnulation}
            />
          ) : (
            <>
              <div className="liste__contenu">
                <span className="liste__titre">{compte.nom}</span>
                <span className="liste__detail">
                  {LIBELLES_TYPE[compte.type_compte]} ·{" "}
                  {formaterSousType(compte.sous_type_compte)} ·{" "}
                  {formaterMontant(compte.solde_initial, compte.devise)}
                </span>
              </div>

              <div className="liste__actions">
                <button
                  type="button"
                  className="bouton-secondaire"
                  onClick={() => onDemarrerModification(compte.id)}
                >
                  Modifier
                </button>

                <button
                  type="button"
                  className="bouton-danger"
                  onClick={() => onSuppression(compte.id)}
                >
                  Supprimer
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

export default CompteList