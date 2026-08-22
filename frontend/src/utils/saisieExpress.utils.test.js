// ============================================================
// TESTS DE L'ANALYSE DE SAISIE EXPRESS
// ============================================================
//
// Teste saisieExpress.utils.js, qui transforme une phrase libre
// ("45 courses carrefour") en données de transaction.
//
// C'est la fonction la plus exposée aux entrées imprévues du
// projet : l'utilisateur y tape ce qu'il veut. Les tests
// couvrent donc autant les phrases mal formées que les
// phrases correctes.
//
// Lancer : npm test

import {
  analyserSaisieExpress,
  detecterCategorie,
} from "./saisieExpress.utils.js"

// Jeu de catégories commun, avec des accents et des majuscules
// pour vérifier que la comparaison les ignore.
const CATEGORIES = [
  { id: 1, nom: "Courses", type_categorie: "depense" },
  { id: 2, nom: "Salaire", type_categorie: "revenu" },
  { id: 3, nom: "Éducation", type_categorie: "depense" },
  { id: 4, nom: "Loyer", type_categorie: "depense" },
]

// ============================================================
// 1. DÉTECTION DE CATÉGORIE
// ============================================================

describe("detecterCategorie", () => {
  it("trouve une catégorie citée dans le libellé", () => {
    expect(detecterCategorie("courses carrefour", CATEGORIES).id).toBe(1)
  })

  it("ignore la casse", () => {
    expect(detecterCategorie("COURSES du soir", CATEGORIES).id).toBe(1)
  })

  /*
    "education" doit trouver "Éducation" : sans la
    normalisation NFD, l'accent ferait échouer la comparaison
    alors que personne ne tape les accents en saisie rapide.
  */
  it("ignore les accents", () => {
    expect(detecterCategorie("education fille", CATEGORIES).id).toBe(3)
  })

  it("renvoie null quand aucune catégorie ne correspond", () => {
    expect(detecterCategorie("essence autoroute", CATEGORIES)).toBeNull()
  })

  it("ne cherche que dans le type imposé", () => {
    // "Courses" existe, mais c'est une dépense : en imposant
    // le type revenu, elle ne doit pas être proposée.
    expect(detecterCategorie("courses", CATEGORIES, "revenu")).toBeNull()
    expect(detecterCategorie("salaire", CATEGORIES, "revenu").id).toBe(2)
  })

  it("renvoie null si la liste de catégories est vide", () => {
    expect(detecterCategorie("courses", [])).toBeNull()
  })
})

// ============================================================
// 2. PHRASES INVALIDES
// ============================================================

describe("analyserSaisieExpress — phrases refusées", () => {
  it("refuse une saisie vide", () => {
    expect(analyserSaisieExpress("", CATEGORIES).estValide).toBe(false)
  })

  it("refuse une saisie composée d'espaces", () => {
    expect(analyserSaisieExpress("   ", CATEGORIES).estValide).toBe(false)
  })

  it("refuse un montant sans libellé", () => {
    expect(analyserSaisieExpress("45", CATEGORIES).estValide).toBe(false)
  })

  it("refuse un libellé sans montant", () => {
    expect(analyserSaisieExpress("courses carrefour", CATEGORIES).estValide).toBe(
      false
    )
  })

  it("refuse un montant placé après le libellé", () => {
    expect(analyserSaisieExpress("courses 45", CATEGORIES).estValide).toBe(false)
  })

  it("refuse un montant nul", () => {
    const resultat = analyserSaisieExpress("0 courses", CATEGORIES)

    expect(resultat.estValide).toBe(false)
    expect(resultat.message).toContain("supérieur à 0")
  })

  // Trois décimales n'existent pas en euros ; les accepter
  // laisserait passer une saisie que le backend arrondirait
  // silencieusement.
  it("refuse plus de deux décimales", () => {
    expect(analyserSaisieExpress("45.123 courses", CATEGORIES).estValide).toBe(
      false
    )
  })

  it("accompagne le refus d'un message d'aide", () => {
    const resultat = analyserSaisieExpress("n'importe quoi", CATEGORIES)

    expect(resultat.message).toBeTruthy()
    expect(resultat.donnees).toBeUndefined()
  })
})

// ============================================================
// 3. MONTANTS
// ============================================================

describe("analyserSaisieExpress — montants", () => {
  it("lit un montant entier", () => {
    expect(analyserSaisieExpress("45 courses", CATEGORIES).donnees.montant).toBe(
      45
    )
  })

  it("lit un montant avec un point décimal", () => {
    expect(
      analyserSaisieExpress("12.50 pain", CATEGORIES).donnees.montant
    ).toBe(12.5)
  })

  // La virgule est la notation française : l'imposer au point
  // serait un piège pour l'utilisateur.
  it("accepte la virgule française", () => {
    expect(
      analyserSaisieExpress("12,50 pain", CATEGORIES).donnees.montant
    ).toBe(12.5)
  })

  /*
    Le montant renvoyé est toujours positif : c'est le champ
    typeTransaction qui porte le sens. Un "-" en entrée
    indique une dépense, il ne rend pas le nombre négatif.
  */
  it("renvoie un montant positif même avec un signe moins", () => {
    expect(
      analyserSaisieExpress("-45 courses", CATEGORIES).donnees.montant
    ).toBe(45)
  })
})

// ============================================================
// 4. DÉTERMINATION DU TYPE
// ============================================================

describe("analyserSaisieExpress — type de transaction", () => {
  it("respecte un signe moins explicite", () => {
    expect(
      analyserSaisieExpress("-45 courses", CATEGORIES).donnees.typeTransaction
    ).toBe("depense")
  })

  it("respecte un signe plus explicite", () => {
    expect(
      analyserSaisieExpress("+2500 prime", CATEGORIES).donnees.typeTransaction
    ).toBe("revenu")
  })

  /*
    Sans signe, c'est la catégorie qui décide. Un salaire n'est
    jamais une dépense : l'utilisateur ne devrait pas avoir à
    le préciser.
  */
  it("déduit le type de la catégorie détectée", () => {
    const revenu = analyserSaisieExpress("2500 salaire", CATEGORIES)
    const depense = analyserSaisieExpress("750 loyer", CATEGORIES)

    expect(revenu.donnees.typeTransaction).toBe("revenu")
    expect(depense.donnees.typeTransaction).toBe("depense")
  })

  // Cas le plus fréquent au quotidien.
  it("choisit une dépense quand rien ne permet de trancher", () => {
    expect(
      analyserSaisieExpress("45 essence", CATEGORIES).donnees.typeTransaction
    ).toBe("depense")
  })

  /*
    Le signe est prioritaire sur la catégorie. "+45 courses"
    force un revenu ; la catégorie "Courses" étant une dépense,
    elle est écartée et la transaction reste sans catégorie.
  */
  it("fait primer le signe sur la catégorie", () => {
    const resultat = analyserSaisieExpress("+45 courses", CATEGORIES)

    expect(resultat.donnees.typeTransaction).toBe("revenu")
    expect(resultat.donnees.categorieId).toBeNull()
  })
})

// ============================================================
// 5. DONNÉES RENVOYÉES
// ============================================================

describe("analyserSaisieExpress — données produites", () => {
  it("conserve le libellé complet", () => {
    expect(
      analyserSaisieExpress("45 courses carrefour", CATEGORIES).donnees.libelle
    ).toBe("courses carrefour")
  })

  it("associe l'identifiant et le nom de la catégorie", () => {
    const donnees = analyserSaisieExpress("45 courses", CATEGORIES).donnees

    expect(donnees.categorieId).toBe(1)
    expect(donnees.nomCategorie).toBe("Courses")
  })

  it("laisse la catégorie à null quand aucune ne correspond", () => {
    const donnees = analyserSaisieExpress("45 essence", CATEGORIES).donnees

    expect(donnees.categorieId).toBeNull()
    expect(donnees.nomCategorie).toBeNull()
  })
})

// ============================================================
// 6. DATE DU JOUR
// ============================================================

/*
  La fonction lit l'horloge : sans précaution, ce test
  donnerait un résultat différent chaque jour.

  vi.setSystemTime fige l'heure vue par le code testé. On
  choisit 23h30 heure de Paris — le moment précis où
  toISOString() basculerait au lendemain en UTC. C'est le bug
  que la construction manuelle de la date évite.
*/
describe("analyserSaisieExpress — date", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("utilise la date du jour au format AAAA-MM-JJ", () => {
    vi.setSystemTime(new Date(2026, 7, 14, 10, 0, 0))

    expect(
      analyserSaisieExpress("45 courses", CATEGORIES).donnees.dateTransaction
    ).toBe("2026-08-14")
  })

  it("reste au jour local même tard le soir", () => {
    vi.setSystemTime(new Date(2026, 7, 14, 23, 30, 0))

    expect(
      analyserSaisieExpress("45 courses", CATEGORIES).donnees.dateTransaction
    ).toBe("2026-08-14")
  })
})