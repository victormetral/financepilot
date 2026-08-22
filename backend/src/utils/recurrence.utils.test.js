// ============================================================
// TESTS DU CALCUL DES DATES DE RÉCURRENCE
// ============================================================
//
// Teste recurrence.utils.js, la logique la plus subtile du
// projet : avancer d'une occurrence sans jamais se tromper de
// jour, y compris aux fins de mois et aux années bissextiles.
//
// Ces vérifications existaient sous forme de commande node
// lancée à la main pendant le Lot 9d. Elles deviennent ici
// permanentes et tournent en CI.
//
// Aucune base de données, aucun serveur : les fonctions
// testées ne manipulent que des chaînes "AAAA-MM-JJ".
//
// Lancer : npm test

import {
  calculerOccurrenceSuivante,
  listerOccurrencesDues,
  OCCURRENCES_MAXIMUM_PAR_APPEL,
} from "./recurrence.utils.js"

// ============================================================
// 1. FINS DE MOIS
// ============================================================

/*
  Le cœur du problème. Un loyer ancré au 31 doit donner
  31 janvier, 28 février, puis retrouver le 31 en mars.

  Le jour d'ancrage vient toujours de date_debut, jamais de
  l'occurrence précédente : sinon le loyer glisserait au 28
  et n'en repartirait plus.
*/
describe("calculerOccurrenceSuivante — fins de mois", () => {
  it("ramène le 31 au dernier jour d'un mois plus court", () => {
    expect(
      calculerOccurrenceSuivante("2026-01-31", "mensuelle", 1, "2026-01-31")
    ).toBe("2026-02-28")
  })

  it("retrouve le 31 le mois suivant grâce à l'ancrage", () => {
    expect(
      calculerOccurrenceSuivante("2026-02-28", "mensuelle", 1, "2026-01-31")
    ).toBe("2026-03-31")
  })

  it("ramène le 31 au 30 dans un mois de trente jours", () => {
    expect(
      calculerOccurrenceSuivante("2026-03-31", "mensuelle", 1, "2026-01-31")
    ).toBe("2026-04-30")
  })

  it("gère le 29 février d'une année bissextile", () => {
    expect(
      calculerOccurrenceSuivante("2028-01-31", "mensuelle", 1, "2028-01-31")
    ).toBe("2028-02-29")
  })

  it("s'arrête au 28 février dans une année normale", () => {
    expect(
      calculerOccurrenceSuivante("2027-01-30", "mensuelle", 1, "2027-01-30")
    ).toBe("2027-02-28")
  })

  /*
    Sur une année entière, un ancrage au 31 ne doit jamais
    dériver : chaque mois affiche soit le 31, soit le dernier
    jour du mois quand il est plus court.
  */
  it("ne dérive pas sur douze mois consécutifs", () => {
    const attendues = [
      "2026-02-28", "2026-03-31", "2026-04-30", "2026-05-31",
      "2026-06-30", "2026-07-31", "2026-08-31", "2026-09-30",
      "2026-10-31", "2026-11-30", "2026-12-31", "2027-01-31",
    ]

    let date = "2026-01-31"

    for (const attendue of attendues) {
      date = calculerOccurrenceSuivante(date, "mensuelle", 1, "2026-01-31")
      expect(date).toBe(attendue)
    }
  })
})

// ============================================================
// 2. FRÉQUENCES ET INTERVALLES
// ============================================================

describe("calculerOccurrenceSuivante — fréquences", () => {
  it("avance de sept jours en hebdomadaire", () => {
    expect(
      calculerOccurrenceSuivante("2026-01-29", "hebdomadaire", 1, "2026-01-29")
    ).toBe("2026-02-05")
  })

  it("avance de trois mois en trimestriel", () => {
    expect(
      calculerOccurrenceSuivante("2026-01-15", "trimestrielle", 1, "2026-01-15")
    ).toBe("2026-04-15")
  })

  it("avance d'un an en annuel", () => {
    expect(
      calculerOccurrenceSuivante("2026-01-15", "annuelle", 1, "2026-01-15")
    ).toBe("2027-01-15")
  })

  it("passe correctement d'une année à l'autre", () => {
    expect(
      calculerOccurrenceSuivante("2026-12-05", "mensuelle", 1, "2026-12-05")
    ).toBe("2027-01-05")
  })
})

describe("calculerOccurrenceSuivante — intervalles", () => {
  it("saute un mois sur deux", () => {
    expect(
      calculerOccurrenceSuivante("2026-01-15", "mensuelle", 2, "2026-01-15")
    ).toBe("2026-03-15")
  })

  it("saute une semaine sur deux", () => {
    expect(
      calculerOccurrenceSuivante("2026-01-01", "hebdomadaire", 2, "2026-01-01")
    ).toBe("2026-01-15")
  })

  // "mensuelle" avec un intervalle de 3 doit équivaloir à
  // "trimestrielle" : les deux notations coexistent, elles ne
  // doivent pas diverger.
  it("équivaut au trimestre avec un intervalle de trois mois", () => {
    expect(
      calculerOccurrenceSuivante("2026-01-15", "mensuelle", 3, "2026-01-15")
    ).toBe(
      calculerOccurrenceSuivante("2026-01-15", "trimestrielle", 1, "2026-01-15")
    )
  })

  it("refuse une fréquence inconnue", () => {
    expect(() =>
      calculerOccurrenceSuivante("2026-01-15", "toutes_les_lunes", 1, "2026-01-15")
    ).toThrow()
  })
})

// ============================================================
// 3. RATTRAPAGE
// ============================================================

describe("listerOccurrencesDues", () => {
  const modele = {
    prochaine_occurrence: "2026-05-05",
    frequence: "mensuelle",
    intervalle: 1,
    date_debut: "2026-05-05",
    date_fin: null,
  }

  it("génère toutes les échéances manquées", () => {
    const resultat = listerOccurrencesDues(modele, "2026-08-14")

    expect(resultat.occurrences).toEqual([
      "2026-05-05",
      "2026-06-05",
      "2026-07-05",
      "2026-08-05",
    ])
  })

  /*
    Le curseur renvoyé est la première occurrence NON générée.
    C'est lui qui garantit qu'un second appel ne recrée pas ce
    qui vient de l'être — l'idempotence de la génération.
  */
  it("renvoie un curseur placé après la dernière occurrence", () => {
    expect(listerOccurrencesDues(modele, "2026-08-14").prochaineOccurrence).toBe(
      "2026-09-05"
    )
  })

  // Rien n'est créé à l'avance : le solde ne doit refléter que
  // des mouvements ayant réellement eu lieu.
  it("ne génère rien dans le futur", () => {
    const futur = { ...modele, prochaine_occurrence: "2026-09-05" }
    const resultat = listerOccurrencesDues(futur, "2026-08-14")

    expect(resultat.occurrences).toEqual([])
    expect(resultat.prochaineOccurrence).toBe("2026-09-05")
  })

  it("génère l'occurrence tombant exactement aujourd'hui", () => {
    const resultat = listerOccurrencesDues(modele, "2026-05-05")

    expect(resultat.occurrences).toEqual(["2026-05-05"])
  })

  it("s'arrête à la date de fin", () => {
    const avecFin = { ...modele, date_fin: "2026-06-30" }
    const resultat = listerOccurrencesDues(avecFin, "2026-08-14")

    expect(resultat.occurrences).toEqual(["2026-05-05", "2026-06-05"])
  })

  it("ne génère rien si la date de fin est déjà passée", () => {
    const terminee = { ...modele, date_fin: "2026-04-01" }

    expect(listerOccurrencesDues(terminee, "2026-08-14").occurrences).toEqual([])
  })

  /*
    Garde-fou contre une date de début saisie en 1990 : sans
    plafond, la boucle produirait des milliers d'occurrences
    d'un coup. Le reste sera rattrapé à l'appel suivant.
  */
  it("plafonne le nombre d'occurrences par appel", () => {
    const tresAncienne = {
      prochaine_occurrence: "1990-01-01",
      frequence: "hebdomadaire",
      intervalle: 1,
      date_debut: "1990-01-01",
      date_fin: null,
    }

    const resultat = listerOccurrencesDues(tresAncienne, "2026-08-14")

    expect(resultat.occurrences).toHaveLength(OCCURRENCES_MAXIMUM_PAR_APPEL)
  })

  it("conserve l'ancrage de fin de mois lors d'un rattrapage", () => {
    const ancreeAu31 = {
      prochaine_occurrence: "2026-01-31",
      frequence: "mensuelle",
      intervalle: 1,
      date_debut: "2026-01-31",
      date_fin: null,
    }

    const resultat = listerOccurrencesDues(ancreeAu31, "2026-04-15")

    expect(resultat.occurrences).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
    ])
  })
})