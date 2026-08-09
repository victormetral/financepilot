import CategorieEditForm from "./CategorieEditForm.jsx"

function CategorieList({
  categories,
  categorieEnModification,
  onDemarrerModification,
  onModification,
  onAnnulation,
  onSuppression,
}) {
  if (categories.length === 0) {
    return <p>Aucune catégorie enregistrée.</p>
  }

  return (
    <ul>
      {categories.map((categorie) => (
        <li key={categorie.id}>
          {categorieEnModification?.id === categorie.id ? (
            <CategorieEditForm
              categorie={categorie}
              onModification={onModification}
              onAnnulation={onAnnulation}
            />
          ) : (
            <>
              <p>
                {categorie.nom} — {categorie.type_categorie}
              </p>

              <button
                type="button"
                onClick={() =>
                  onDemarrerModification(categorie)
                }
              >
                Modifier
              </button>

              <button
                type="button"
                onClick={() => onSuppression(categorie.id)}
              >
                Supprimer
              </button>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

export default CategorieList