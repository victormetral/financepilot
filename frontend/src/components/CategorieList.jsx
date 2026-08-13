// ============================================================
// LISTE DES CATÉGORIES
// ============================================================
//
// Rôle : affiche les catégories avec leurs actions. Un seul
// élément peut être en modification à la fois.
//
// Utilisé par : pages/PageCategories.jsx
// Utilise : CategorieEditForm.jsx

import CategorieEditForm from "./CategorieEditForm.jsx"

// Le backend stocke "depense"/"revenu" : on affiche un libellé lisible.
function formaterNature(typeCategorie) {
  return typeCategorie === "revenu" ? "Revenu" : "Dépense"
}

function CategorieList({
  categories,
  categorieEnModification,
  onDemarrerModification,
  onModification,
  onAnnulation,
  onSuppression,
}) {
  if (categories.length === 0) {
    return <p className="liste__vide">Aucune catégorie enregistrée.</p>
  }

  return (
    <ul className="liste">
      {categories.map((categorie) => (
        <li key={categorie.id} className="liste__element">
          {categorieEnModification?.id === categorie.id ? (
            <CategorieEditForm
              categorie={categorie}
              onModification={onModification}
              onAnnulation={onAnnulation}
            />
          ) : (
            <>
              <div className="liste__contenu">
                <span className="liste__titre">{categorie.nom}</span>
                <span className="liste__detail">
                  {formaterNature(categorie.type_categorie)}
                </span>
              </div>

              <div className="liste__actions">
                <button
                  type="button"
                  className="bouton-secondaire"
                  onClick={() => onDemarrerModification(categorie)}
                >
                  Modifier
                </button>

                <button
                  type="button"
                  className="bouton-danger"
                  onClick={() => onSuppression(categorie.id)}
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

export default CategorieList