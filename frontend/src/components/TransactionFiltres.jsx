// ============================================================
// FILTRES DE LA LISTE DES TRANSACTIONS
// ============================================================
//
// Rôle : piloter la recherche et les filtres de la liste.
// Utilisé par : pages/PageTransactions.jsx.
//
// Le composant ne conserve aucun état : les valeurs viennent du
// hook useTransactions et chaque changement y remonte
// immédiatement, ce qui déclenche le rechargement côté serveur.
// C'est ce qui évite d'avoir un bouton « Rechercher ».

// ============================================================
// 1. CONSTANTES
// ============================================================

const TYPES_TRANSACTION = [
  { valeur: "depense", libelle: "Dépense" },
  { valeur: "revenu", libelle: "Revenu" },
  { valeur: "transfert", libelle: "Transfert" },
]

// ============================================================
// 2. COMPOSANT
// ============================================================

function TransactionFiltres({
  filtres,
  comptes,
  categories,
  onChangementFiltre,
  onReinitialisation,
}) {
  /*
    Un filtre est actif dès qu'une valeur n'est pas vide.
    Sert à n'afficher le bouton de remise à zéro que lorsqu'il
    a une utilité.
  */
  const filtresActifs = Object.values(filtres).some(
    (valeur) => valeur !== ""
  )

  return (
    <div className="formulaire">
      <h3>Rechercher et filtrer</h3>

      <label htmlFor="rechercheTransaction">Libellé contient</label>
      <input
        id="rechercheTransaction"
        type="text"
        placeholder="carrefour, loyer..."
        value={filtres.recherche}
        onChange={(event) =>
          onChangementFiltre("recherche", event.target.value)
        }
      />

      <label htmlFor="compteFiltre">Compte</label>
      <select
        id="compteFiltre"
        value={filtres.compteId}
        onChange={(event) =>
          onChangementFiltre("compteId", event.target.value)
        }
      >
        <option value="">Tous les comptes</option>
        {comptes.map((compte) => (
          <option key={compte.id} value={compte.id}>
            {compte.nom}
          </option>
        ))}
      </select>

      <label htmlFor="categorieFiltre">Catégorie</label>
      <select
        id="categorieFiltre"
        value={filtres.categorieId}
        onChange={(event) =>
          onChangementFiltre("categorieId", event.target.value)
        }
      >
        <option value="">Toutes les catégories</option>
        {categories.map((categorie) => (
          <option key={categorie.id} value={categorie.id}>
            {categorie.nom}
          </option>
        ))}
      </select>

      <label htmlFor="typeFiltre">Type</label>
      <select
        id="typeFiltre"
        value={filtres.typeTransaction}
        onChange={(event) =>
          onChangementFiltre("typeTransaction", event.target.value)
        }
      >
        <option value="">Tous les types</option>
        {TYPES_TRANSACTION.map((type) => (
          <option key={type.valeur} value={type.valeur}>
            {type.libelle}
          </option>
        ))}
      </select>

      <label htmlFor="dateDebutFiltre">À partir du</label>
      <input
        id="dateDebutFiltre"
        type="date"
        value={filtres.dateDebut}
        onChange={(event) =>
          onChangementFiltre("dateDebut", event.target.value)
        }
      />

      <label htmlFor="dateFinFiltre">Jusqu'au</label>
      <input
        id="dateFinFiltre"
        type="date"
        value={filtres.dateFin}
        onChange={(event) =>
          onChangementFiltre("dateFin", event.target.value)
        }
      />

      {filtresActifs && (
        <button
          type="button"
          className="bouton-secondaire"
          onClick={onReinitialisation}
        >
          Effacer les filtres
        </button>
      )}
    </div>
  )
}

export default TransactionFiltres