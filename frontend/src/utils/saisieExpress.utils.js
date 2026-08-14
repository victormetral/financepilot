// ============================================================
// ANALYSE DE LA SAISIE EXPRESS
// ============================================================
//
// Rôle : transformer une phrase libre en données de transaction.
// Utilisé par : SaisieExpress.jsx.
// N'utilise : rien (fonctions pures, sans fetch ni état React).
//
// Exemples :
//   "45 courses carrefour"  → dépense, catégorie "Courses"
//   "2500 salaire"          → revenu, car la catégorie
//                             "Salaire" est de type revenu
//   "-45 courses"           → dépense (signe explicite)
//   "+2500 prime"           → revenu (signe explicite)
//   "12,50 pain"            → la virgule française est acceptée
//
// Ces fonctions sont pures : mêmes entrées, mêmes sorties.
// C'est volontaire, pour pouvoir les tester avec Vitest
// (chantier tests prévu en parallèle du lot 9).

// ============================================================
// 1. OUTILS DE NORMALISATION
// ============================================================

/*
  Prépare un texte pour la comparaison :
  minuscules et suppression des accents.

  "Écolage" → "ecolage"

  normalize("NFD") sépare les lettres de leurs accents,
  puis la plage Unicode 0300-036f (les accents seuls)
  est retirée.
*/
const normaliserTexte = (texte) => {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

// ============================================================
// 2. DÉTECTION DE LA CATÉGORIE
// ============================================================

/*
  Cherche une catégorie dont le nom apparaît dans le libellé.

  La comparaison ignore la casse et les accents :
  libellé "courses carrefour" ↔ catégorie "Courses" → trouvée.

  typeImpose limite la recherche à un type précis. Il vaut null
  quand l'utilisateur n'a pas mis de signe : dans ce cas toutes
  les catégories sont candidates, et c'est celle qui est trouvée
  qui déterminera le type de la transaction.

  En cas d'absence, null est renvoyé : la transaction sera
  créée sans catégorie, ce que le backend accepte.
*/
export const detecterCategorie = (
  libelle,
  categories,
  typeImpose = null
) => {
  const libelleNormalise = normaliserTexte(libelle)

  const categoriesCandidates =
    typeImpose === null
      ? categories
      : categories.filter(
          (categorie) => categorie.type_categorie === typeImpose
        )

  for (const categorie of categoriesCandidates) {
    const nomNormalise = normaliserTexte(categorie.nom)

    if (libelleNormalise.includes(nomNormalise)) {
      return categorie
    }
  }

  return null
}

// ============================================================
// 3. ANALYSE DE LA PHRASE
// ============================================================

/*
  Transforme la phrase saisie en données de transaction.

  Format attendu :
  [+|-]montant libellé

  Détermination du type, par ordre de priorité :

  1. le signe explicite : "+" donne un revenu, "-" une dépense ;
  2. sans signe, le type de la catégorie détectée : "2500 salaire"
     devient un revenu parce que la catégorie "Salaire" en est un.
     C'est le cas courant : un salaire n'est jamais une dépense,
     et l'utilisateur ne devrait pas avoir à le préciser ;
  3. sans catégorie non plus, une dépense, de loin le cas
     le plus fréquent au quotidien.

  La date est toujours celle du jour : la saisie express sert au
  quotidien ; le formulaire classique reste disponible pour les
  dates passées.

  Renvoie :
  { estValide, message }            si la phrase est invalide
  { estValide, donnees }            sinon
*/
export const analyserSaisieExpress = (texte, categories) => {
  const texteNettoye = texte.trim()

  if (texteNettoye === "") {
    return {
      estValide: false,
      message: "Saisis un montant suivi d'un libellé",
    }
  }

  /*
    Découpage par l'expression régulière :

    ^([+-]?)        → un "+" ou un "-" facultatif au début
    (\d+(?:[.,]\d{1,2})?) → un montant, décimales facultatives
    \s+(.+)$        → au moins un espace puis le libellé

    Exemple : "+2500,50 prime aout"
    → ["+", "2500,50", "prime aout"]
  */
  const correspondance = texteNettoye.match(
    /^([+-]?)(\d+(?:[.,]\d{1,2})?)\s+(.+)$/
  )

  if (!correspondance) {
    return {
      estValide: false,
      message:
        "Format attendu : montant puis libellé " +
        "(ex. « 45 courses carrefour » ou « 2500 salaire »)",
    }
  }

  const [, signe, montantTexte, libelle] = correspondance

  /*
    La virgule française devient un point pour Number().
    "12,50" → 12.5
  */
  const montant = Number(montantTexte.replace(",", "."))

  if (montant <= 0) {
    return {
      estValide: false,
      message: "Le montant doit être supérieur à 0",
    }
  }

  // Le signe, quand il existe, fixe le type et restreint donc
  // la recherche de catégorie à ce même type.
  let typeTransaction = null

  if (signe === "+") {
    typeTransaction = "revenu"
  } else if (signe === "-") {
    typeTransaction = "depense"
  }

  const categorie = detecterCategorie(
    libelle,
    categories,
    typeTransaction
  )

  // Sans signe, la catégorie décide ; à défaut, dépense.
  if (typeTransaction === null) {
    typeTransaction = categorie
      ? categorie.type_categorie
      : "depense"
  }

  /*
    La date du jour au format AAAA-MM-JJ attendu
    par le backend.

    toISOString() renvoie l'heure UTC : en soirée à Paris
    la date UTC peut encore être celle de la veille, donc la
    construction manuelle en heure locale est plus sûre.
  */
  const maintenant = new Date()

  const dateTransaction = [
    maintenant.getFullYear(),
    String(maintenant.getMonth() + 1).padStart(2, "0"),
    String(maintenant.getDate()).padStart(2, "0"),
  ].join("-")

  return {
    estValide: true,
    donnees: {
      montant,
      libelle: libelle.trim(),
      typeTransaction,
      categorieId: categorie ? categorie.id : null,
      nomCategorie: categorie ? categorie.nom : null,
      dateTransaction,
    },
  }
}