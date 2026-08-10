/*
  VALIDATEUR DES FILTRES DE TRANSACTIONS

  Contient uniquement validerFiltresTransactions, isolée
  ici car elle vérifie 8 paramètres GET différents (compte,
  catégorie, type, dates, recherche, pagination) — trop
  volumineuse pour rester dans transaction.validator.js.

  Utilisé par :
  - transaction.controller.js

  Ne doit pas : appeler PostgreSQL, utiliser request/response,
  envoyer de statut HTTP.
*/

import {
  validationReussie,
  validationEchouee,
} from "../utils/validator.utils.js"

import { dateEstValide, periodeEstValide } from "../utils/date.utils.js"

import {
  entierPositifEstValide,
  valeurEstAutorisee,
} from "../utils/validation.utils.js"

import {
  convertirPagination,
  limiteEstValide,
  pageEstValide,
  calculerOffset,
} from "../utils/pagination.utils.js"

import { TYPES_TRANSACTION_AUTORISES } from "../constants/transaction.constants.js"

// Exemple : "3" → 3, undefined → undefined
const convertirNombreFacultatif = (valeur) => {
  return valeur !== undefined ? Number(valeur) : undefined
}

/*
  Valide les paramètres facultatifs de GET /api/transactions.

  Paramètres acceptés :
  compte_id, categorie_id, type_transaction, date_debut,
  date_fin, recherche, limite, page.
*/
export const validerFiltresTransactions = (query) => {
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

  const compteId = convertirNombreFacultatif(compte_id)
  const categorieId = convertirNombreFacultatif(categorie_id)

  const { limiteNombre, pageNombre } = convertirPagination({ limite, page })

  if (compteId !== undefined && !entierPositifEstValide(compteId)) {
    return validationEchouee("compte_id doit être un nombre entier supérieur à 0")
  }

  if (categorieId !== undefined && !entierPositifEstValide(categorieId)) {
    return validationEchouee(
      "categorie_id doit être un nombre entier supérieur à 0"
    )
  }

  if (
    type_transaction !== undefined &&
    !valeurEstAutorisee(type_transaction, TYPES_TRANSACTION_AUTORISES)
  ) {
    return validationEchouee(
      "type_transaction doit être revenu, depense ou transfert"
    )
  }

  if (date_debut !== undefined && !dateEstValide(date_debut)) {
    return validationEchouee(
      "date_debut doit être une date valide au format AAAA-MM-JJ"
    )
  }

  if (date_fin !== undefined && !dateEstValide(date_fin)) {
    return validationEchouee(
      "date_fin doit être une date valide au format AAAA-MM-JJ"
    )
  }

  if (
    date_debut !== undefined &&
    date_fin !== undefined &&
    !periodeEstValide(date_debut, date_fin)
  ) {
    return validationEchouee("date_debut doit être antérieure ou égale à date_fin")
  }

  if (!limiteEstValide(limiteNombre)) {
    return validationEchouee("limite doit être un nombre entier compris entre 1 et 100")
  }

  if (!pageEstValide(pageNombre)) {
    return validationEchouee("page doit être un nombre entier supérieur à 0")
  }

  const offset = calculerOffset(pageNombre, limiteNombre)

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