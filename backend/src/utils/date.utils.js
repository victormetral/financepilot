/*
  OUTILS COMMUNS POUR LES DATES

  Ce fichier centralise la validation des dates reçues par l’API.

  Utilisé notamment par :
  - transaction.controller.js
  - objectif.controller.js
  - operationInvestissement.controller.js

  Règle actuelle :
  - format obligatoire : AAAA-MM-JJ
  - la date doit réellement exister

  Victor :
  si les règles liées aux dates changent plus tard,
  modifie ce fichier plutôt que chaque contrôleur.
*/

// Format attendu : année-mois-jour
const formatDate = /^\d{4}-\d{2}-\d{2}$/

/*
  Vérifie qu’une valeur :
  1. est un texte ;
  2. respecte le format AAAA-MM-JJ ;
  3. correspond à une vraie date du calendrier.
*/
export const dateEstValide = (date) => {
  if (
    typeof date !== "string" ||
    !formatDate.test(date)
  ) {
    return false
  }

  // Transforme "2026-07-31" en [2026, 7, 31]
  const [annee, mois, jour] = date
    .split("-")
    .map(Number)

  /*
    JavaScript compte les mois à partir de zéro :

    janvier = 0
    février = 1
    décembre = 11
  */
  const dateConstruite = new Date(
    Date.UTC(annee, mois - 1, jour)
  )

  /*
    JavaScript corrige automatiquement certaines dates
    impossibles.

    On compare donc le résultat construit aux valeurs reçues.
  */
  return (
    dateConstruite.getUTCFullYear() === annee &&
    dateConstruite.getUTCMonth() === mois - 1 &&
    dateConstruite.getUTCDate() === jour
  )
}

/*
  Vérifie qu’une période est cohérente.

  Grâce au format AAAA-MM-JJ, les deux textes peuvent être
  comparés directement.

  Exemple valide :
  2026-07-01 → 2026-07-31
*/
export const periodeEstValide = (
  dateDebut,
  dateFin
) => {
  if (
    !dateEstValide(dateDebut) ||
    !dateEstValide(dateFin)
  ) {
    return false
  }

  return dateDebut <= dateFin
}
