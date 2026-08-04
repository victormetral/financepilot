/*
  VALIDATEUR DES COMPTES

  Ce fichier centralise toutes les règles de validation
  liées aux comptes bancaires de FinancePilot.

  Utilisé par :
  - compte.controller.js

  Son rôle :
  - valider les identifiants ;
  - vérifier les champs obligatoires ;
  - convertir les données numériques ;
  - nettoyer les textes ;
  - appliquer les valeurs par défaut du POST.

  Valeurs par défaut lors de la création :
  - solde_initial = 0 ;
  - devise = "EUR".

  Règle de sécurité :
  - utilisateur_id ne vient jamais du body JSON ;
  - il sera récupéré depuis le JWT par le contrôleur.

  Ce fichier ne doit pas :
  - utiliser request ou response ;
  - envoyer de statut HTTP ;
  - exécuter de requête SQL ;
  - appeler directement PostgreSQL.

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
  Vérifie l’identifiant d’un compte reçu dans l’URL.

  Exemple :
  GET /api/comptes/3

  L’identifiant doit être :
  - un entier ;
  - strictement supérieur à zéro.
*/
export const validerIdCompte = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant du compte doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Valide les données utilisées pour créer un compte.

  Champs obligatoires :
  - nom ;
  - type_compte.

  Champs facultatifs :
  - solde_initial, avec 0 par défaut ;
  - devise, avec EUR par défaut.

  🟨 CORRIGÉ :
  utilisateur_id n’est plus demandé au client.
  Il proviendra de l’utilisateur authentifié par JWT.
*/
export const validerCreationCompte = (body) => {
  // 🟨 CORRIGÉ : utilisateur_id a été retiré.
  const {
    nom,
    type_compte,
    solde_initial = 0,
    devise = "EUR",
  } = body

  // 🟨 CORRIGÉ
  if (
    nom === undefined ||
    type_compte === undefined
  ) {
    return validationEchouee(
      "nom et type_compte sont obligatoires"
    )
  }

  const soldeInitial = Number(solde_initial)

  if (!texteEstValide(nom)) {
    return validationEchouee(
      "nom doit être un texte non vide"
    )
  }

  /*
    Aucun type de compte fermé n’existe encore
    dans les règles actuelles du projet.

    On vérifie donc seulement que type_compte
    est un texte non vide.
  */
  if (!texteEstValide(type_compte)) {
    return validationEchouee(
      "type_compte doit être un texte non vide"
    )
  }

  /*
    Le solde initial peut être :
    - positif ;
    - égal à zéro ;
    - négatif, par exemple pour un découvert.

    On vérifie seulement qu’il s’agit d’un nombre fini.
  */
  if (!Number.isFinite(soldeInitial)) {
    return validationEchouee(
      "solde_initial doit être un nombre valide"
    )
  }

  if (!texteEstValide(devise)) {
    return validationEchouee(
      "devise doit être un texte non vide"
    )
  }

  /*
    Nettoyage des données avant envoi au contrôleur :

    - retrait des espaces inutiles ;
    - type de compte en minuscules ;
    - devise en majuscules.

    🟨 CORRIGÉ :
    utilisateur_id est volontairement absent.
  */
  return validationReussie({
    nom: nom.trim(),
    type_compte:
      type_compte.trim().toLowerCase(),
    solde_initial: soldeInitial,
    devise: devise.trim().toUpperCase(),
  })
}

/*
  Valide les données utilisées pour modifier
  entièrement un compte.

  PUT exige :
  - nom ;
  - type_compte ;
  - solde_initial ;
  - devise.

  utilisateur_id n’est pas modifié par cette route.
*/
export const validerModificationCompte = (
  body
) => {
  const {
    nom,
    type_compte,
    solde_initial,
    devise,
  } = body

  if (
    nom === undefined ||
    type_compte === undefined ||
    solde_initial === undefined ||
    devise === undefined
  ) {
    return validationEchouee(
      "nom, type_compte, solde_initial et devise sont obligatoires"
    )
  }

  const soldeInitial = Number(solde_initial)

  if (!texteEstValide(nom)) {
    return validationEchouee(
      "nom doit être un texte non vide"
    )
  }

  if (!texteEstValide(type_compte)) {
    return validationEchouee(
      "type_compte doit être un texte non vide"
    )
  }

  if (!Number.isFinite(soldeInitial)) {
    return validationEchouee(
      "solde_initial doit être un nombre valide"
    )
  }

  if (!texteEstValide(devise)) {
    return validationEchouee(
      "devise doit être un texte non vide"
    )
  }

  return validationReussie({
    nom: nom.trim(),
    type_compte:
      type_compte.trim().toLowerCase(),
    solde_initial: soldeInitial,
    devise: devise.trim().toUpperCase(),
  })
}