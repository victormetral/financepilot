/*
  VALIDATEUR DES CATÉGORIES

  Ce fichier centralise les règles de validation
  liées aux catégories de FinancePilot.

  Utilisé par :
  - categorie.controller.js

  Son rôle :
  - valider les identifiants ;
  - vérifier les champs obligatoires ;
  - convertir utilisateur_id en nombre ;
  - vérifier les textes ;
  - nettoyer les données avant leur envoi au service.

  Ce fichier ne doit pas :
  - utiliser request ou response ;
  - envoyer de réponse HTTP ;
  - exécuter de requête SQL ;
  - appeler directement PostgreSQL.

  Il renvoie toujours :
  - estValide: true avec donnees ;
  - ou estValide: false avec message.

  Victor :
  les types de catégories ne sont pas encore limités
  par une liste fermée dans le projet.

  Pour le moment, type_categorie doit simplement
  être un texte non vide.
*/

import {
  entierPositifEstValide,
  texteEstValide,
} from "../utils/validation.utils.js"

/*
  Construit une validation réussie.

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
  Construit une validation échouée.

  Exemple :

  {
    estValide: false,
    message: "nom invalide"
  }
*/
const validationEchouee = (message) => {
  return {
    estValide: false,
    message,
  }
}

/*
  Vérifie l’identifiant d’une catégorie
  reçu dans l’URL.

  Exemple :
  GET /api/categories/3

  L’identifiant doit être :
  - un nombre entier ;
  - strictement supérieur à zéro.
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
  - utilisateur_id ;
  - nom ;
  - type_categorie.
*/
export const validerCreationCategorie = (
  body
) => {
  const {
    utilisateur_id,
    nom,
    type_categorie,
  } = body

  if (
    utilisateur_id === undefined ||
    nom === undefined ||
    type_categorie === undefined
  ) {
    return validationEchouee(
      "utilisateur_id, nom et type_categorie sont obligatoires"
    )
  }

  /*
    utilisateur_id peut être reçu comme nombre
    ou comme texte dans le JSON.

    Exemple :
    "3" devient 3.
  */
  const utilisateurId = Number(
    utilisateur_id
  )

  if (
    !entierPositifEstValide(
      utilisateurId
    )
  ) {
    return validationEchouee(
      "utilisateur_id doit être un nombre entier supérieur à 0"
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
    trim() retire les espaces inutiles
    placés au début et à la fin.

    Exemple :
    " Alimentation " devient "Alimentation".
  */
  return validationReussie({
    utilisateur_id: utilisateurId,
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

  utilisateur_id reste inchangé,
  conformément au fonctionnement actuel du service.
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