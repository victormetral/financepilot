// ============================================================
// TESTS DES CALCULS FINANCIERS
// ============================================================
//
// Teste finance.utils.js, le seul endroit du projet où vit la
// logique financière. Ces fonctions sont pures : elles ne
// dépendent ni de React ni du réseau, donc chaque test se
// résume à « pour ces données, ce résultat ».
//
// Toutes les dates passées en argument sont explicites : une
// fonction qui lirait l'heure courante donnerait un test dont
// le résultat change selon le jour où on le lance.
//
// Lancer : npm test (une fois) ou npm run test:watch (continu)

import {
  calculerSoldeCompte,
  calculerTotalLiquidites,
  calculerPositionActif,
  calculerValeurPortefeuille,
  calculerPatrimoineNet,
  calculerFluxDuMois,
  calculerResteAVivre,
  calculerCoutOpportunite,
  projeterAtteinteObjectif,
  formaterMontant,
  formaterPourcentage,
  estDansLeMois,
  joursDansLeMois,
} from "./finance.utils.js"

// ============================================================
// 1. OUTILS DE DATE
// ============================================================

describe("joursDansLeMois", () => {
  it("compte 31 jours en janvier", () => {
    expect(joursDansLeMois(1, 2026)).toBe(31)
  })

  it("compte 28 jours en février d'une année normale", () => {
    expect(joursDansLeMois(2, 2026)).toBe(28)
  })

  it("compte 29 jours en février d'une année bissextile", () => {
    expect(joursDansLeMois(2, 2028)).toBe(29)
  })
})

describe("estDansLeMois", () => {
  it("reconnaît une date du mois demandé", () => {
    expect(estDansLeMois("2026-08-14", 8, 2026)).toBe(true)
  })

  it("rejette le même jour d'un autre mois", () => {
    expect(estDansLeMois("2026-07-14", 8, 2026)).toBe(false)
  })

  // Format hérité d'avant le correctif de fuseau du Lot 9d :
  // la fonction doit continuer à l'accepter.
  it("accepte encore une date au format ISO complet", () => {
    expect(estDansLeMois("2026-08-14T00:00:00.000Z", 8, 2026)).toBe(true)
  })
})

// ============================================================
// 2. SOLDES
// ============================================================

describe("calculerSoldeCompte", () => {
  const compte = { id: 1, solde_initial: 1000 }

  it("ajoute les revenus et retranche les dépenses", () => {
    const transactions = [
      { compte_id: 1, montant: 2000, type_transaction: "revenu" },
      { compte_id: 1, montant: -750, type_transaction: "depense" },
    ]

    expect(calculerSoldeCompte(compte, transactions)).toBe(2250)
  })

  /*
    Le signe du montant d'une dépense n'est pas garanti : la
    saisie manuelle peut produire 750 comme -750. La fonction
    prend la valeur absolue, donc les deux doivent donner le
    même résultat.
  */
  it("traite une dépense identiquement, quel que soit son signe", () => {
    const avecSigne = calculerSoldeCompte(compte, [
      { compte_id: 1, montant: -100, type_transaction: "depense" },
    ])

    const sansSigne = calculerSoldeCompte(compte, [
      { compte_id: 1, montant: 100, type_transaction: "depense" },
    ])

    expect(avecSigne).toBe(sansSigne)
    expect(avecSigne).toBe(900)
  })

  it("ignore les transactions d'un autre compte", () => {
    const transactions = [
      { compte_id: 2, montant: -500, type_transaction: "depense" },
    ]

    expect(calculerSoldeCompte(compte, transactions)).toBe(1000)
  })

  /*
    Limite assumée et documentée dans finance.utils.js : sans
    compte de destination, compter un transfert comme une
    sortie ferait baisser le patrimoine à tort.
  */
  it("ignore les transferts", () => {
    const transactions = [
      { compte_id: 1, montant: -300, type_transaction: "transfert" },
    ]

    expect(calculerSoldeCompte(compte, transactions)).toBe(1000)
  })

  it("accepte des montants sous forme de chaîne", () => {
    const transactions = [
      { compte_id: 1, montant: "-750.00", type_transaction: "depense" },
    ]

    expect(calculerSoldeCompte(compte, transactions)).toBe(250)
  })
})

describe("calculerTotalLiquidites", () => {
  it("additionne le solde de tous les comptes", () => {
    const comptes = [
      { id: 1, solde_initial: 1000 },
      { id: 2, solde_initial: 500 },
    ]

    const transactions = [
      { compte_id: 1, montant: -200, type_transaction: "depense" },
    ]

    expect(calculerTotalLiquidites(comptes, transactions)).toBe(1300)
  })

  it("renvoie 0 sans aucun compte", () => {
    expect(calculerTotalLiquidites([], [])).toBe(0)
  })
})

// ============================================================
// 3. PORTEFEUILLE
// ============================================================

describe("calculerPositionActif", () => {
  /*
    Coût moyen pondéré, norme fiscale française :
    (10 × 100 + 5) + (10 × 120 + 5) = 2210 pour 20 titres,
    soit un prix de revient unitaire de 110,50.
  */
  it("calcule le prix de revient unitaire frais inclus", () => {
    const operations = [
      { type_operation: "achat", quantite: 10, prix_unitaire: 100, frais: 5 },
      { type_operation: "achat", quantite: 10, prix_unitaire: 120, frais: 5 },
    ]

    const position = calculerPositionActif(operations)

    expect(position.quantiteNette).toBe(20)
    expect(position.pru).toBeCloseTo(110.5, 2)
  })

  // Une vente réduit la quantité mais ne change pas le PRU
  // des titres conservés.
  it("ne modifie pas le prix de revient après une vente", () => {
    const operations = [
      { type_operation: "achat", quantite: 10, prix_unitaire: 100, frais: 0 },
      { type_operation: "vente", quantite: 4, prix_unitaire: 150, frais: 0 },
    ]

    const position = calculerPositionActif(operations)

    expect(position.quantiteNette).toBe(6)
    expect(position.pru).toBe(100)
    expect(position.valeur).toBe(600)
  })

  it("renvoie un prix de revient nul sans aucun achat", () => {
    expect(calculerPositionActif([]).pru).toBe(0)
  })
})

describe("calculerValeurPortefeuille", () => {
  // Chaque actif doit avoir son propre prix de revient :
  // les mélanger donnerait une moyenne dénuée de sens.
  it("sépare les actifs les uns des autres", () => {
    const operations = [
      { actif_financier_id: 1, type_operation: "achat", quantite: 10, prix_unitaire: 100, frais: 0 },
      { actif_financier_id: 2, type_operation: "achat", quantite: 5, prix_unitaire: 200, frais: 0 },
    ]

    expect(calculerValeurPortefeuille(operations)).toBe(2000)
  })
})

describe("calculerPatrimoineNet", () => {
  it("additionne liquidités et portefeuille", () => {
    const comptes = [{ id: 1, solde_initial: 1000 }]

    const operations = [
      { actif_financier_id: 1, type_operation: "achat", quantite: 10, prix_unitaire: 50, frais: 0 },
    ]

    expect(calculerPatrimoineNet(comptes, [], operations)).toBe(1500)
  })
})

// ============================================================
// 4. FLUX DU MOIS
// ============================================================

describe("calculerFluxDuMois", () => {
  const transactions = [
    { date_transaction: "2026-08-01", montant: 3000, type_transaction: "revenu" },
    { date_transaction: "2026-08-05", montant: -750, type_transaction: "depense" },
    { date_transaction: "2026-08-10", montant: -250, type_transaction: "depense" },
    { date_transaction: "2026-07-15", montant: -900, type_transaction: "depense" },
  ]

  it("ne retient que les transactions du mois demandé", () => {
    const flux = calculerFluxDuMois(transactions, 8, 2026)

    expect(flux.entrees).toBe(3000)
    expect(flux.sorties).toBe(1000)
    expect(flux.epargne).toBe(2000)
  })

  it("calcule le taux d'épargne en pourcentage", () => {
    expect(calculerFluxDuMois(transactions, 8, 2026).tauxEpargne).toBeCloseTo(
      66.67,
      1
    )
  })

  // Sans revenu, le taux serait une division par zéro.
  it("renvoie un taux nul quand il n'y a aucune entrée", () => {
    const fluxSansRevenu = calculerFluxDuMois(
      [{ date_transaction: "2026-08-05", montant: -100, type_transaction: "depense" }],
      8,
      2026
    )

    expect(fluxSansRevenu.tauxEpargne).toBe(0)
  })

  it("renvoie des flux nuls pour un mois sans transaction", () => {
    const flux = calculerFluxDuMois(transactions, 1, 2026)

    expect(flux.entrees).toBe(0)
    expect(flux.sorties).toBe(0)
  })
})

// ============================================================
// 5. RESTE À VIVRE
// ============================================================

describe("calculerResteAVivre", () => {
  const budgets = [
    { categorie_id: 1, mois: 8, annee: 2026, montant_limite: 600 },
    { categorie_id: 2, mois: 8, annee: 2026, montant_limite: 400 },
  ]

  const transactions = [
    { categorie_id: 1, date_transaction: "2026-08-05", montant: -200, type_transaction: "depense" },
    { categorie_id: 9, date_transaction: "2026-08-06", montant: -150, type_transaction: "depense" },
  ]

  // Le 15 août : 15 jours écoulés sur 31, 17 restants.
  const LE_15_AOUT = new Date(2026, 7, 15)

  it("sépare les dépenses budgétées des autres", () => {
    const reste = calculerResteAVivre(budgets, transactions, 8, 2026, LE_15_AOUT)

    expect(reste.budgete).toBe(1000)
    expect(reste.consomme).toBe(200)
    expect(reste.reste).toBe(800)
    expect(reste.depensesHorsBudget).toBe(150)
  })

  it("répartit le reste sur les jours restants", () => {
    const reste = calculerResteAVivre(budgets, transactions, 8, 2026, LE_15_AOUT)

    expect(reste.joursRestants).toBe(17)
    expect(reste.parJour).toBeCloseTo(800 / 17, 2)
  })

  /*
    rythme < 1 : la consommation est en dessous du théorique.
    Au 15 août, 15/31 du budget « devrait » être consommé,
    soit 483 € ; seuls 200 € l'ont été.
  */
  it("signale une consommation plus lente que prévu", () => {
    const reste = calculerResteAVivre(budgets, transactions, 8, 2026, LE_15_AOUT)

    expect(reste.rythme).toBeLessThan(1)
  })

  it("ignore les budgets d'un autre mois", () => {
    const reste = calculerResteAVivre(budgets, transactions, 7, 2026, LE_15_AOUT)

    expect(reste.budgete).toBe(0)
  })
})

// ============================================================
// 6. COÛT D'OPPORTUNITÉ ET PROJECTION
// ============================================================

describe("calculerCoutOpportunite", () => {
  // 100 € à 7 % pendant 20 ans ≈ 386,97 €.
  it("applique les intérêts composés", () => {
    expect(calculerCoutOpportunite(100)).toBeCloseTo(386.97, 1)
  })

  // Une dépense est saisie en négatif : sans valeur absolue,
  // le coût d'opportunité serait négatif, ce qui n'a aucun sens.
  it("traite un montant négatif comme son équivalent positif", () => {
    expect(calculerCoutOpportunite(-100)).toBe(calculerCoutOpportunite(100))
  })

  it("accepte un taux et une durée personnalisés", () => {
    expect(calculerCoutOpportunite(1000, 0.05, 10)).toBeCloseTo(1628.89, 1)
  })
})

describe("projeterAtteinteObjectif", () => {
  const LE_15_AOUT = new Date(2026, 7, 15)

  it("signale un objectif déjà atteint", () => {
    const projection = projeterAtteinteObjectif(5000, 5000, 200, LE_15_AOUT)

    expect(projection.atteint).toBe(true)
    expect(projection.moisRestants).toBe(0)
  })

  it("arrondit au mois supérieur", () => {
    // 1000 € restants à 300 €/mois = 3,33 mois, donc 4.
    const projection = projeterAtteinteObjectif(0, 1000, 300, LE_15_AOUT)

    expect(projection.moisRestants).toBe(4)
    expect(projection.dateEstimee.getMonth()).toBe(11)
  })

  /*
    Sans épargne, l'objectif ne sera jamais atteint. Renvoyer
    null est préférable à une date absurde située dans des
    siècles.
  */
  it("ne projette rien sans épargne", () => {
    const projection = projeterAtteinteObjectif(0, 1000, 0, LE_15_AOUT)

    expect(projection.dateEstimee).toBeNull()
    expect(projection.moisRestants).toBeNull()
  })
})

// ============================================================
// 7. FORMATAGE
// ============================================================

describe("formaterMontant", () => {
  /*
    Intl insère des espaces insécables, invisibles mais
    différents d'une espace ordinaire. Les normaliser évite un
    test qui échoue sur un caractère qu'on ne voit pas.
  */
  const normaliser = (texte) => texte.replace(/[\u202f\u00a0]/g, " ")

  it("formate un montant en euros à la française", () => {
    expect(normaliser(formaterMontant(1234.5))).toBe("1 234,50 €")
  })

  it("conserve le signe négatif", () => {
    expect(normaliser(formaterMontant(-750))).toBe("-750,00 €")
  })

  it("accepte un montant sous forme de chaîne", () => {
    expect(normaliser(formaterMontant("-750.00"))).toBe("-750,00 €")
  })
})

describe("formaterPourcentage", () => {
  it("affiche une décimale par défaut", () => {
    expect(formaterPourcentage(66.666)).toBe("66.7 %")
  })

  it("accepte un nombre de décimales personnalisé", () => {
    expect(formaterPourcentage(66.666, 0)).toBe("67 %")
  })
})