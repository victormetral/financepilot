/*
  VALIDATEUR DES COMPTES

  Valide et normalise les données des comptes.
  Ne doit pas : appeler PostgreSQL, envoyer de réponse HTTP.
*/

import {
  validationReussie,
  validationEchouee,
} from "../utils/validator.utils.js"

import {
  entierPositifEstValide,
  texteEstValide,
} from "../utils/validation.utils.js"

import {
  TYPES_COMPTE_AUTORISES,
  sousTypeCompteEstValide,
} from "../constants/compte.constants.js"

export const validerIdCompte = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee("L'identifiant du compte doit être un nombre entier supérieur à 0")
  }

  return validationReussie({ id: idNombre })
}

// Un sous-type doit appartenir au type de compte choisi.
const validerTypeEtSousTypeCompte = (typeCompteBrut, sousTypeCompteBrut) => {
  if (!texteEstValide(typeCompteBrut) || !texteEstValide(sousTypeCompteBrut)) {
    return validationEchouee("type_compte et sous_type_compte doivent être des textes non vides")
  }

  const typeCompte = typeCompteBrut.trim().toLowerCase()
  const sousTypeCompte = sousTypeCompteBrut.trim().toLowerCase()

  if (!TYPES_COMPTE_AUTORISES.includes(typeCompte)) {
    return validationEchouee("type_compte est invalide")
  }

  if (!sousTypeCompteEstValide(typeCompte, sousTypeCompte)) {
    return validationEchouee("sous_type_compte est invalide pour ce type_compte")
  }

  return validationReussie({ typeCompte, sousTypeCompte })
}

// Le solde peut être négatif (découvert bancaire).
const validerDonneesCompte = ({ nom, type_compte, sous_type_compte, solde_initial, devise }) => {
  if (!texteEstValide(nom)) {
    return validationEchouee("nom doit être un texte non vide")
  }

  const resultatTypeCompte = validerTypeEtSousTypeCompte(type_compte, sous_type_compte)

  if (!resultatTypeCompte.estValide) {
    return resultatTypeCompte
  }

  const soldeInitial = Number(solde_initial)

  if (!Number.isFinite(soldeInitial)) {
    return validationEchouee("solde_initial doit être un nombre valide")
  }

  if (!texteEstValide(devise)) {
    return validationEchouee("devise doit être un texte non vide")
  }

  return validationReussie({
    nom: nom.trim(),
    type_compte: resultatTypeCompte.donnees.typeCompte,
    sous_type_compte: resultatTypeCompte.donnees.sousTypeCompte,
    solde_initial: soldeInitial,
    devise: devise.trim().toUpperCase(),
  })
}

export const validerCreationCompte = (body) => {
  const { nom, type_compte, sous_type_compte, solde_initial = 0, devise = "EUR" } = body

  if (nom === undefined || type_compte === undefined || sous_type_compte === undefined) {
    return validationEchouee("nom, type_compte et sous_type_compte sont obligatoires")
  }

  return validerDonneesCompte({ nom, type_compte, sous_type_compte, solde_initial, devise })
}

export const validerModificationCompte = (body) => {
  const { nom, type_compte, sous_type_compte, solde_initial, devise } = body

  if (
    nom === undefined || type_compte === undefined || sous_type_compte === undefined ||
    solde_initial === undefined || devise === undefined
  ) {
    return validationEchouee(
      "nom, type_compte, sous_type_compte, solde_initial et devise sont obligatoires"
    )
  }

  return validerDonneesCompte({ nom, type_compte, sous_type_compte, solde_initial, devise })
}