/*
  VALIDATEUR DES CATÉGORIES

  Ce fichier centralise les règles de validation
  liées aux catégories.

  Utilisé par :
  - categorie.controller.js

  Règle de sécurité :
  - utilisateur_id n’est jamais choisi dans le JSON ;
  - il est récupéré depuis le JWT par le contrôleur.

  Il renvoie toujours :
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
} from "../utils/validation.utils.js"

/*
  Vérifie l’identifiant d’une catégorie
  reçu dans l’URL.
*/
export const validerIdCategorie = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant de la catégorie doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Valide les données utilisées pour créer
  une catégorie.

  Champs obligatoires :
  - nom ;
  - type_categorie.

  🟨 CORRIGÉ :
  utilisateur_id n’est plus obligatoire.
  Une éventuelle valeur envoyée dans le JSON
  est volontairement ignorée.
*/
export const validerCreationCategorie = (
  body
) => {
  // 🟨 CORRIGÉ : utilisateur_id a été retiré.
  const {
    nom,
    type_categorie,
  } = body

  // 🟨 CORRIGÉ
  if (
    nom === undefined ||
    type_categorie === undefined
  ) {
    return validationEchouee(
      "nom et type_categorie sont obligatoires"
    )
  }

  if (!texteEstValide(nom)) {
    return validationEchouee(
      "nom doit être un texte non vide"
    )
  }

  if (!texteEstValide(type_categorie)) {
    return validationEchouee(
      "type_categorie doit être un texte non vide"
    )
  }

  /*
    🟨 CORRIGÉ :
    utilisateur_id est volontairement absent
    des données validées.
  */
  return validationReussie({
    nom: nom.trim(),
    type_categorie:
      type_categorie.trim(),
  })
}

/*
  Valide les données utilisées pour modifier
  entièrement une catégorie.

  PUT exige :
  - nom ;
  - type_categorie.

  utilisateur_id reste inchangé.
*/
export const validerModificationCategorie = (
  body
) => {
  const {
    nom,
    type_categorie,
  } = body

  if (
    nom === undefined ||
    type_categorie === undefined
  ) {
    return validationEchouee(
      "nom et type_categorie sont obligatoires"
    )
  }

  if (!texteEstValide(nom)) {
    return validationEchouee(
      "nom doit être un texte non vide"
    )
  }

  if (!texteEstValide(type_categorie)) {
    return validationEchouee(
      "type_categorie doit être un texte non vide"
    )
  }

  return validationReussie({
    nom: nom.trim(),
    type_categorie:
      type_categorie.trim(),
  })
}