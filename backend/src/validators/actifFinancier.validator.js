/*
  VALIDATEUR DES ACTIFS FINANCIERS

  Ce fichier centralise toutes les règles de validation
  liées aux actifs financiers.

  Utilisé par :
  - actifFinancier.controller.js

  Son rôle :
  - valider les identifiants ;
  - vérifier les champs obligatoires ;
  - vérifier les textes ;
  - vérifier le type d’actif ;
  - nettoyer et normaliser les données.

  Normalisation appliquée :
  - symbole en majuscules ;
  - devise en majuscules ;
  - espaces inutiles retirés.

  Ce fichier ne doit pas :
  - utiliser request ou response ;
  - envoyer de réponse HTTP ;
  - appeler PostgreSQL ;
  - exécuter une requête SQL.

  Il renvoie :
  - estValide: true avec donnees ;
  - ou estValide: false avec message.
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

import {
  TYPES_ACTIF_AUTORISES,
  DEVISE_PAR_DEFAUT,
} from "../constants/actifFinancier.constants.js"

/*
  Vérifie l’identifiant d’un actif financier
  reçu dans l’URL.

  Exemple :
  GET /api/actifs-financiers/3
*/
export const validerIdActifFinancier = (
  id
) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant de l’actif financier doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Valide les données utilisées pour créer
  un actif financier.

  Champs obligatoires :
  - symbole ;
  - nom ;
  - type_actif.

  Champ facultatif :
  - devise, avec EUR par défaut.
*/
export const validerCreationActifFinancier = (
  body
) => {
  const {
    symbole,
    nom,
    type_actif,
    devise = DEVISE_PAR_DEFAUT,
  } = body

  if (
    symbole === undefined ||
    nom === undefined ||
    type_actif === undefined
  ) {
    return validationEchouee(
      "symbole, nom et type_actif sont obligatoires"
    )
  }

  if (!texteEstValide(symbole)) {
    return validationEchouee(
      "symbole doit être un texte non vide"
    )
  }

  if (!texteEstValide(nom)) {
    return validationEchouee(
      "nom doit être un texte non vide"
    )
  }

  if (
    !valeurEstAutorisee(
      type_actif,
      TYPES_ACTIF_AUTORISES
    )
  ) {
    return validationEchouee(
      "type_actif doit être action, etf, crypto, obligation, fonds, immobilier ou autre"
    )
  }

  if (!texteEstValide(devise)) {
    return validationEchouee(
      "devise doit être un texte non vide"
    )
  }

  /*
    Les données sont nettoyées avant d’être envoyées
    au contrôleur puis au service.

    Exemple :
    " btc " devient "BTC".
  */
  return validationReussie({
    symbole: symbole.trim().toUpperCase(),
    nom: nom.trim(),
    type_actif,
    devise: devise.trim().toUpperCase(),
  })
}

/*
  Valide les données utilisées pour modifier
  entièrement un actif financier.

  PUT exige tous les champs :
  - symbole ;
  - nom ;
  - type_actif ;
  - devise.
*/
export const validerModificationActifFinancier =
  (body) => {
    const {
      symbole,
      nom,
      type_actif,
      devise,
    } = body

    if (
      symbole === undefined ||
      nom === undefined ||
      type_actif === undefined ||
      devise === undefined
    ) {
      return validationEchouee(
        "symbole, nom, type_actif et devise sont obligatoires"
      )
    }

    if (!texteEstValide(symbole)) {
      return validationEchouee(
        "symbole doit être un texte non vide"
      )
    }

    if (!texteEstValide(nom)) {
      return validationEchouee(
        "nom doit être un texte non vide"
      )
    }

    if (
      !valeurEstAutorisee(
        type_actif,
        TYPES_ACTIF_AUTORISES
      )
    ) {
      return validationEchouee(
        "type_actif doit être action, etf, crypto, obligation, fonds, immobilier ou autre"
      )
    }

    if (!texteEstValide(devise)) {
      return validationEchouee(
        "devise doit être un texte non vide"
      )
    }

    return validationReussie({
      symbole: symbole.trim().toUpperCase(),
      nom: nom.trim(),
      type_actif,
      devise: devise.trim().toUpperCase(),
    })
  }