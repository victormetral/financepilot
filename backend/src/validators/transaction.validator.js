/*
  VALIDATEUR DES TRANSACTIONS

  Ce fichier centralise toutes les règles métier liées aux
  transactions.

  Il est utilisé par transaction.controller.js.

  Son rôle :
  - convertir les données reçues ;
  - vérifier les filtres GET ;
  - vérifier les données POST et PUT ;
  - vérifier les identifiants ;
  - renvoyer des données déjà propres au contrôleur.

  Victor :
  ce fichier ne doit pas :
  - appeler PostgreSQL ;
  - utiliser request ou response ;
  - envoyer de statut HTTP.

  Il renvoie seulement :
  - estValide ;
  - message ;
  - donnees.
*/

import {
  dateEstValide,
  periodeEstValide,
} from "../utils/date.utils.js"

import {
  entierPositifEstValide,
  texteEstValide,
  valeurEstAutorisee,
} from "../utils/validation.utils.js"

import {
  convertirPagination,
  limiteEstValide,
  pageEstValide,
  calculerOffset,
} from "../utils/pagination.utils.js"

import {
  TYPES_TRANSACTION_AUTORISES,
} from "../constants/transaction.constants.js"

/*
  Construit une réponse de validation réussie.

  Exemple :
  {
    estValide: true,
    donnees: {...}
  }
*/
const validationReussie = (donnees) => {
  return {
    estValide: true,
    donnees,
  }
}

/*
  Construit une réponse de validation échouée.

  Exemple :
  {
    estValide: false,
    message: "compte_id invalide"
  }
*/
const validationEchouee = (message) => {
  return {
    estValide: false,
    message,
  }
}

/*
  Convertit une valeur facultative en nombre.

  Exemple :
  "3" → 3
  undefined → undefined
*/
const convertirNombreFacultatif = (valeur) => {
  return valeur !== undefined
    ? Number(valeur)
    : undefined
}

/*
  Vérifie un identifiant présent dans une URL.

  Exemples valides :
  1
  25

  Exemples invalides :
  "bonjour"
  2.5
  0
  -4
*/
export const validerIdTransaction = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant de la transaction doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Valide les paramètres facultatifs de GET /api/transactions.

  Paramètres acceptés :
  - compte_id
  - categorie_id
  - type_transaction
  - date_debut
  - date_fin
  - recherche
  - limite
  - page
*/
export const validerFiltresTransactions = (
  query
) => {
  const {
    compte_id,
    categorie_id,
    type_transaction,
    date_debut,
    date_fin,
    recherche,
    limite,
    page,
  } = query

  const compteId =
    convertirNombreFacultatif(compte_id)

  const categorieId =
    convertirNombreFacultatif(categorie_id)

  const {
    limiteNombre,
    pageNombre,
  } = convertirPagination({
    limite,
    page,
  })

  if (
    compteId !== undefined &&
    !entierPositifEstValide(compteId)
  ) {
    return validationEchouee(
      "compte_id doit être un nombre entier supérieur à 0"
    )
  }

  if (
    categorieId !== undefined &&
    !entierPositifEstValide(categorieId)
  ) {
    return validationEchouee(
      "categorie_id doit être un nombre entier supérieur à 0"
    )
  }

  if (
    type_transaction !== undefined &&
    !valeurEstAutorisee(
      type_transaction,
      TYPES_TRANSACTION_AUTORISES
    )
  ) {
    return validationEchouee(
      "type_transaction doit être revenu, depense ou transfert"
    )
  }

  if (
    date_debut !== undefined &&
    !dateEstValide(date_debut)
  ) {
    return validationEchouee(
      "date_debut doit être une date valide au format AAAA-MM-JJ"
    )
  }

  if (
    date_fin !== undefined &&
    !dateEstValide(date_fin)
  ) {
    return validationEchouee(
      "date_fin doit être une date valide au format AAAA-MM-JJ"
    )
  }

  if (
    date_debut !== undefined &&
    date_fin !== undefined &&
    !periodeEstValide(date_debut, date_fin)
  ) {
    return validationEchouee(
      "date_debut doit être antérieure ou égale à date_fin"
    )
  }

  if (!limiteEstValide(limiteNombre)) {
    return validationEchouee(
      "limite doit être un nombre entier compris entre 1 et 100"
    )
  }

  if (!pageEstValide(pageNombre)) {
    return validationEchouee(
      "page doit être un nombre entier supérieur à 0"
    )
  }

  const offset =
    calculerOffset(pageNombre, limiteNombre)

  return validationReussie({
    compteId,
    categorieId,
    typeTransaction: type_transaction,
    dateDebut: date_debut,
    dateFin: date_fin,
    recherche,
    limite: limiteNombre,
    page: pageNombre,
    offset,
  })
}

/*
  Valide les données utilisées pour créer ou modifier
  une transaction.

  Cette même fonction peut être utilisée par POST et PUT
  car les deux routes attendent les mêmes données.
*/
export const validerDonneesTransaction = (
  body
) => {
  const {
    compte_id,
    categorie_id,
    libelle,
    montant,
    date_transaction,
    type_transaction,
  } = body

  if (
    compte_id === undefined ||
    libelle === undefined ||
    montant === undefined ||
    date_transaction === undefined ||
    type_transaction === undefined
  ) {
    return validationEchouee(
      "compte_id, libelle, montant, date_transaction et type_transaction sont obligatoires"
    )
  }

  const compteId = Number(compte_id)

  /*
    categorie_id est facultatif.

    Il peut donc être :
    - un identifiant valide ;
    - null ;
    - absent.
  */
  const categorieId =
    categorie_id !== undefined &&
    categorie_id !== null
      ? Number(categorie_id)
      : null

  const montantNombre = Number(montant)

  if (!entierPositifEstValide(compteId)) {
    return validationEchouee(
      "compte_id doit être un nombre entier supérieur à 0"
    )
  }

  if (
    categorieId !== null &&
    !entierPositifEstValide(categorieId)
  ) {
    return validationEchouee(
      "categorie_id doit être null ou un nombre entier supérieur à 0"
    )
  }

  if (!texteEstValide(libelle)) {
    return validationEchouee(
      "libelle doit être un texte non vide"
    )
  }

  /*
    Un montant peut être positif ou négatif.

    On vérifie donc seulement qu’il s’agit d’un vrai nombre.
  */
  if (!Number.isFinite(montantNombre)) {
    return validationEchouee(
      "montant doit être un nombre valide"
    )
  }

  if (!dateEstValide(date_transaction)) {
    return validationEchouee(
      "date_transaction doit être une date valide au format AAAA-MM-JJ"
    )
  }

  if (
    !valeurEstAutorisee(
      type_transaction,
      TYPES_TRANSACTION_AUTORISES
    )
  ) {
    return validationEchouee(
      "type_transaction doit être revenu, depense ou transfert"
    )
  }

  return validationReussie({
    compte_id: compteId,
    categorie_id: categorieId,
    libelle: libelle.trim(),
    montant: montantNombre,
    date_transaction,
    type_transaction,
  })
}