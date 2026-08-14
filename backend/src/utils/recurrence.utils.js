/*
  CALCUL DES DATES DE RÉCURRENCE

  Fonctions pures : aucune base de données, aucun accès au
  réseau, aucune horloge implicite. La date du jour est
  toujours passée en argument, ce qui rend chaque fonction
  testable et son résultat reproductible.

  Utilisé par :
  - recurrenceGeneration.service.js

  Format des dates : texte "AAAA-MM-JJ" de bout en bout,
  comme ce que renvoie désormais PostgreSQL. Aucun objet Date
  n'est manipulé en dehors des fonctions internes ci-dessous :
  les objets Date portent un fuseau horaire, et le fuseau est
  la principale source de bugs sur des dates sans heure.
*/

// ============================================================
// 1. OUTILS INTERNES
// ============================================================

/*
  Découpe "2026-09-05" en { annee: 2026, mois: 9, jour: 5 }.

  Le mois est ici le mois humain (1 à 12), pas l'indice
  JavaScript (0 à 11) : la confusion entre les deux est
  une source d'erreurs classique.
*/
const decouperDate = (texteDate) => {
  const [annee, mois, jour] = texteDate.split("-").map(Number)

  return { annee, mois, jour }
}

/*
  Recompose "2026-09-05" à partir de ses trois nombres,
  en complétant par un zéro à gauche si nécessaire.
*/
const assemblerDate = (annee, mois, jour) => {
  const moisTexte = String(mois).padStart(2, "0")
  const jourTexte = String(jour).padStart(2, "0")

  return `${annee}-${moisTexte}-${jourTexte}`
}

/*
  Nombre de jours d'un mois donné.

  Astuce : le jour 0 du mois suivant est le dernier jour du
  mois demandé. Date.UTC évite tout décalage de fuseau, et
  getUTCDate lit la valeur dans le même repère.

  Exemple : mois = 2, annee = 2028 → 29 (année bissextile).
*/
const nombreDeJoursDansLeMois = (annee, mois) => {
  return new Date(Date.UTC(annee, mois, 0)).getUTCDate()
}

/*
  Avance une date d'un nombre de mois, en conservant le jour
  d'ancrage passé séparément.

  C'est le cœur du problème des fins de mois. Un loyer ancré
  au 31 doit donner : 31 janvier, 28 février, 31 mars.
  Si l'on repartait du 28 février pour calculer la suite, le
  loyer glisserait au 28 et n'y reviendrait jamais.

  Le jour d'ancrage vient donc toujours de date_debut, jamais
  de l'occurrence précédente. Il est simplement ramené au
  dernier jour du mois quand ce jour n'existe pas.
*/
const avancerDeMois = (texteDate, nombreDeMois, jourAncrage) => {
  const { annee, mois } = decouperDate(texteDate)

  // Compte en mois absolus pour laisser le calcul gérer
  // le passage d'une année à l'autre.
  const moisAbsolu = annee * 12 + (mois - 1) + nombreDeMois

  const nouvelleAnnee = Math.floor(moisAbsolu / 12)
  const nouveauMois = (moisAbsolu % 12) + 1

  const jourMaximum = nombreDeJoursDansLeMois(nouvelleAnnee, nouveauMois)
  const nouveauJour = Math.min(jourAncrage, jourMaximum)

  return assemblerDate(nouvelleAnnee, nouveauMois, nouveauJour)
}

/*
  Avance une date d'un nombre de jours.

  Utilisé uniquement par la fréquence hebdomadaire, où la
  question du jour d'ancrage ne se pose pas : sept jours
  après le 31 janvier, on est toujours un 7 février.
*/
const avancerDeJours = (texteDate, nombreDeJours) => {
  const { annee, mois, jour } = decouperDate(texteDate)

  const date = new Date(Date.UTC(annee, mois - 1, jour + nombreDeJours))

  return assemblerDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  )
}

// ============================================================
// 2. AVANCER D'UNE OCCURRENCE
// ============================================================

/*
  Renvoie la date de l'occurrence suivante.

  Paramètres :
  - dateActuelle : "AAAA-MM-JJ", l'occurrence de départ
  - frequence    : hebdomadaire | mensuelle | trimestrielle | annuelle
  - intervalle   : nombre entier ≥ 1, "toutes les N fois"
  - dateDebut    : "AAAA-MM-JJ", d'où provient le jour d'ancrage

  Exemples :
  calculerOccurrenceSuivante("2026-01-31", "mensuelle", 1, "2026-01-31")
  → "2026-02-28"

  calculerOccurrenceSuivante("2026-02-28", "mensuelle", 1, "2026-01-31")
  → "2026-03-31"   (le 31 est retrouvé grâce à l'ancrage)
*/
export const calculerOccurrenceSuivante = (
  dateActuelle,
  frequence,
  intervalle,
  dateDebut
) => {
  const { jour: jourAncrage } = decouperDate(dateDebut)

  if (frequence === "hebdomadaire") {
    return avancerDeJours(dateActuelle, 7 * intervalle)
  }

  if (frequence === "mensuelle") {
    return avancerDeMois(dateActuelle, intervalle, jourAncrage)
  }

  if (frequence === "trimestrielle") {
    return avancerDeMois(dateActuelle, 3 * intervalle, jourAncrage)
  }

  if (frequence === "annuelle") {
    return avancerDeMois(dateActuelle, 12 * intervalle, jourAncrage)
  }

  /*
    Le validator et la contrainte CHECK filtrent déjà les
    fréquences inconnues. Si l'on arrive ici, c'est qu'une
    valeur a été insérée hors de l'API : mieux vaut une
    erreur explicite qu'une boucle qui n'avance jamais.
  */
  throw new Error(`Fréquence inconnue : ${frequence}`)
}

// ============================================================
// 3. LISTER LES OCCURRENCES DUES
// ============================================================

/*
  Plafond de sécurité. Une date de début saisie en 1990 avec
  une fréquence hebdomadaire produirait près de 2000
  occurrences : la boucle s'arrête avant, et le reste sera
  rattrapé à l'appel suivant.
*/
export const OCCURRENCES_MAXIMUM_PAR_APPEL = 500

/*
  Renvoie la liste des dates à créer, de la plus ancienne à
  la plus récente.

  Une occurrence est due si elle est antérieure ou égale à
  aujourd'hui, et si elle ne dépasse pas la date de fin.
  Rien n'est généré dans le futur : le solde ne doit refléter
  que des mouvements ayant réellement eu lieu.

  Paramètres :
  - recurrence : { prochaine_occurrence, frequence, intervalle,
                   date_debut, date_fin }
  - aujourdhui : "AAAA-MM-JJ"

  La comparaison de chaînes suffit : le format AAAA-MM-JJ
  se trie alphabétiquement dans l'ordre chronologique.
*/
export const listerOccurrencesDues = (recurrence, aujourdhui) => {
  const {
    prochaine_occurrence,
    frequence,
    intervalle,
    date_debut,
    date_fin,
  } = recurrence

  const occurrences = []
  let dateCourante = prochaine_occurrence

  while (
    dateCourante <= aujourdhui &&
    (date_fin === null || dateCourante <= date_fin) &&
    occurrences.length < OCCURRENCES_MAXIMUM_PAR_APPEL
  ) {
    occurrences.push(dateCourante)

    dateCourante = calculerOccurrenceSuivante(
      dateCourante,
      frequence,
      intervalle,
      date_debut
    )
  }

  /*
    Le curseur renvoyé est la première occurrence NON générée.
    C'est lui qui sera écrit en base : il garantit qu'un
    second appel ne recrée pas ce qui vient de l'être.
  */
  return {
    occurrences,
    prochaineOccurrence: dateCourante,
  }
}