/*
  VALIDATEUR DES TRANSACTIONS (CRUD)

  Contient la validation de l'identifiant et des données
  de création/modification d'une transaction.

  La validation des filtres GET vit dans
  transactionFiltres.validator.js (fonction trop volumineuse
  pour rester ici).

  Utilisé par :
  - transaction.controller.js

  Ne doit pas : appeler PostgreSQL, utiliser request/response,
  envoyer de statut HTTP.
*/

import {
  validationReussie,
  validationEchouee,
} from "../utils/validator.utils.js"

import { dateEstValide } from "../utils/date.utils.js"

import {
  entierPositifEstValide,
  texteEstValide,
  valeurEstAutorisee,
} from "../utils/validation.utils.js"

import { TYPES_TRANSACTION_AUTORISES } from "../constants/transaction.constants.js"

export const validerIdTransaction = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L'identifiant de la transaction doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({ id: idNombre })
}

/*
  Fonction commune au POST et au PUT :
  les deux routes attendent les mêmes données.
*/
export const validerDonneesTransaction = (body) => {
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

  // categorie_id est facultatif : identifiant valide, null, ou absent.
  const categorieId =
    categorie_id !== undefined && categorie_id !== null
      ? Number(categorie_id)
      : null

  const montantNombre = Number(montant)

  if (!entierPositifEstValide(compteId)) {
    return validationEchouee(
      "compte_id doit être un nombre entier supérieur à 0"
    )
  }

  if (categorieId !== null && !entierPositifEstValide(categorieId)) {
    return validationEchouee(
      "categorie_id doit être null ou un nombre entier supérieur à 0"
    )
  }

  if (!texteEstValide(libelle)) {
    return validationEchouee("libelle doit être un texte non vide")
  }

  // Un montant peut être positif ou négatif : on vérifie juste que c'est un vrai nombre.
  if (!Number.isFinite(montantNombre)) {
    return validationEchouee("montant doit être un nombre valide")
  }

  if (!dateEstValide(date_transaction)) {
    return validationEchouee(
      "date_transaction doit être une date valide au format AAAA-MM-JJ"
    )
  }

  if (!valeurEstAutorisee(type_transaction, TYPES_TRANSACTION_AUTORISES)) {
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