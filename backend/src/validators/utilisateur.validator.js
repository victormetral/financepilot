/*
  VALIDATEUR DES UTILISATEURS

  Ce fichier centralise les règles de validation liées
  aux utilisateurs de FinancePilot.

  Utilisé par :
  - utilisateur.controller.js

  Son rôle :
  - valider les identifiants ;
  - vérifier les champs obligatoires ;
  - vérifier le nom et le prénom ;
  - vérifier le format de l’email ;
  - vérifier la longueur minimale du mot de passe ;
  - nettoyer et normaliser les données.

  Normalisation appliquée :
  - espaces retirés autour du nom et du prénom ;
  - email converti en minuscules ;
  - espaces retirés autour de l’email.

  Ce fichier ne doit pas :
  - utiliser request ou response ;
  - envoyer de statut HTTP ;
  - appeler bcrypt ;
  - exécuter de requête SQL ;
  - appeler PostgreSQL.

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
  emailEstValide,
  motDePasseEstValide,
} from "../utils/validation.utils.js"

/*
  Vérifie l’identifiant d’un utilisateur reçu dans l’URL.

  Exemple :
  GET /api/utilisateurs/3
*/
export const validerIdUtilisateur = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant de l’utilisateur doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Valide les données utilisées pour créer
  ou modifier entièrement un utilisateur.

  Cette fonction est commune au POST et au PUT,
  car les deux routes exigent les mêmes champs :

  - nom ;
  - prenom ;
  - email ;
  - mot_de_passe.
*/
export const validerDonneesUtilisateur = (
  body
) => {
  const {
    nom,
    prenom,
    email,
    mot_de_passe,
  } = body

  if (
    nom === undefined ||
    prenom === undefined ||
    email === undefined ||
    mot_de_passe === undefined
  ) {
    return validationEchouee(
      "nom, prenom, email et mot_de_passe sont obligatoires"
    )
  }

  if (!texteEstValide(nom)) {
    return validationEchouee(
      "nom doit être un texte non vide"
    )
  }

  if (!texteEstValide(prenom)) {
    return validationEchouee(
      "prenom doit être un texte non vide"
    )
  }

  if (!emailEstValide(email)) {
    return validationEchouee(
      "email doit avoir un format valide"
    )
  }

  /*
    La règle actuelle impose au minimum
    huit caractères.

    La vérification détaillée reste centralisée
    dans validation.utils.js.
  */
  if (!motDePasseEstValide(mot_de_passe)) {
    return validationEchouee(
      "mot_de_passe doit contenir au moins 8 caractères"
    )
  }

  /*
    Le mot de passe reste volontairement en clair
    dans les données validées.

    Il sera immédiatement haché dans le contrôleur
    avant d’être transmis au service.
  */
  return validationReussie({
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: email.trim().toLowerCase(),
    mot_de_passe,
  })
}