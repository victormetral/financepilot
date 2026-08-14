/*
  VALIDATEUR DES ACTIFS FINANCIERS

  Utilisé par : actifFinancier.controller.js
  Normalisation : symbole en majuscules, espaces retirés.
  La devise est vérifiée contre une liste fermée
  (devise.constants.js).
  Ne doit pas : appeler PostgreSQL, utiliser request/response.
*/

import {
  validationReussie,
  validationEchouee,
} from "../utils/validator.utils.js"

import {
  entierPositifEstValide,
  texteEstValide,
  valeurEstAutorisee,
} from "../utils/validation.utils.js"

import { TYPES_ACTIF_AUTORISES } from "../constants/actifFinancier.constants.js"

import {
  DEVISES_AUTORISEES,
  DEVISE_PAR_DEFAUT,
} from "../constants/devise.constants.js"

export const validerIdActifFinancier = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L'identifiant de l'actif financier doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({ id: idNombre })
}

// Règles communes à la création et à la modification.
const validerDonneesActif = ({ symbole, nom, type_actif, devise }) => {
  if (!texteEstValide(symbole)) {
    return validationEchouee("symbole doit être un texte non vide")
  }

  if (!texteEstValide(nom)) {
    return validationEchouee("nom doit être un texte non vide")
  }

  if (!valeurEstAutorisee(type_actif, TYPES_ACTIF_AUTORISES)) {
    return validationEchouee(
      "type_actif doit être action, etf, crypto, obligation, fonds, immobilier ou autre"
    )
  }

  if (!texteEstValide(devise)) {
    return validationEchouee("devise doit être un texte non vide")
  }

  const deviseNormalisee = devise.trim().toUpperCase()

  if (!DEVISES_AUTORISEES.includes(deviseNormalisee)) {
    return validationEchouee(
      `devise doit être l'une des valeurs suivantes : ${DEVISES_AUTORISEES.join(", ")}`
    )
  }

  return validationReussie({
    symbole: symbole.trim().toUpperCase(),
    nom: nom.trim(),
    type_actif,
    devise: deviseNormalisee,
  })
}

export const validerCreationActifFinancier = (body) => {
  const { symbole, nom, type_actif, devise = DEVISE_PAR_DEFAUT } = body

  if (symbole === undefined || nom === undefined || type_actif === undefined) {
    return validationEchouee("symbole, nom et type_actif sont obligatoires")
  }

  return validerDonneesActif({ symbole, nom, type_actif, devise })
}

export const validerModificationActifFinancier = (body) => {
  const { symbole, nom, type_actif, devise } = body

  if (
    symbole === undefined ||
    nom === undefined ||
    type_actif === undefined ||
    devise === undefined
  ) {
    return validationEchouee("symbole, nom, type_actif et devise sont obligatoires")
  }

  return validerDonneesActif({ symbole, nom, type_actif, devise })
}