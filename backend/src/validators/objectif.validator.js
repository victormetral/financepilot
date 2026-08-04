/*
  VALIDATEUR DES OBJECTIFS

  Utilisé par :
  - objectif.controller.js

  🟨 CORRIGÉ :
  utilisateur_id n'est plus accepté dans le JSON.
  Le propriétaire est déterminé par le JWT.
*/

import {
  validationReussie,
  validationEchouee,
} from "../utils/validator.utils.js"

import { dateEstValide } from "../utils/date.utils.js"

import {
  entierPositifEstValide,
  nombrePositifEstValide,
  nombrePositifOuNulEstValide,
  texteEstValide,
  valeurEstAutorisee,
} from "../utils/validation.utils.js"

import {
  STATUTS_OBJECTIF_AUTORISES,
} from "../constants/objectif.constants.js"

export const validerIdObjectif = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant de l’objectif doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({ id: idNombre })
}

/*
  Fonction commune au POST et au PUT.

  modification = false :
  montant_actuel et statut peuvent utiliser leurs défauts.

  modification = true :
  ils sont obligatoires car PUT remplace l'objet complet.
*/
const validerDonneesObjectif = (
  body,
  { modification }
) => {
  const {
    nom,
    montant_cible,
    montant_actuel = modification
      ? undefined
      : 0,
    date_echeance = null,
    statut = modification
      ? undefined
      : "en cours",
  } = body

  if (
    nom === undefined ||
    montant_cible === undefined ||
    montant_actuel === undefined ||
    statut === undefined
  ) {
    return validationEchouee(
      modification
        ? "nom, montant_cible, montant_actuel et statut sont obligatoires"
        : "nom et montant_cible sont obligatoires"
    )
  }

  const montantCible = Number(montant_cible)
  const montantActuel = Number(montant_actuel)

  if (!texteEstValide(nom)) {
    return validationEchouee(
      "nom doit être un texte non vide"
    )
  }

  if (!nombrePositifEstValide(montantCible)) {
    return validationEchouee(
      "montant_cible doit être un nombre supérieur à 0"
    )
  }

  if (
    !nombrePositifOuNulEstValide(
      montantActuel
    )
  ) {
    return validationEchouee(
      "montant_actuel doit être un nombre supérieur ou égal à 0"
    )
  }

  if (
    date_echeance !== null &&
    !dateEstValide(date_echeance)
  ) {
    return validationEchouee(
      "date_echeance doit être une date valide au format AAAA-MM-JJ"
    )
  }

  if (
    !valeurEstAutorisee(
      statut,
      STATUTS_OBJECTIF_AUTORISES
    )
  ) {
    return validationEchouee(
      "statut doit être en cours, atteint ou abandonne"
    )
  }

  return validationReussie({
    nom: nom.trim(),
    montant_cible: montantCible,
    montant_actuel: montantActuel,
    date_echeance,
    statut,
  })
}

export const validerCreationObjectif = (body) => {
  return validerDonneesObjectif(body, {
    modification: false,
  })
}

export const validerModificationObjectif = (body) => {
  return validerDonneesObjectif(body, {
    modification: true,
  })
}
