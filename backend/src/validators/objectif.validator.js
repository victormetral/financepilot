/*
  VALIDATEUR DES OBJECTIFS FINANCIERS

  Ce fichier centralise toutes les règles de validation
  liées aux objectifs d’épargne ou d’investissement.

  Utilisé par :
  - objectif.controller.js

  Son rôle :
  - valider les identifiants ;
  - convertir les valeurs numériques ;
  - vérifier les textes, montants, dates et statuts ;
  - préparer des données propres pour le service.

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
  dateEstValide,
} from "../utils/date.utils.js"

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
    message: "montant invalide"
  }
*/
const validationEchouee = (message) => {
  return {
    estValide: false,
    message,
  }
}

/*
  Vérifie l’identifiant d’un objectif reçu dans l’URL.

  Exemple :
  GET /api/objectifs/3
*/
export const validerIdObjectif = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant de l’objectif doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Valide les données envoyées lors de la création
  d’un objectif.

  Champs obligatoires :
  - utilisateur_id ;
  - nom ;
  - montant_cible.

  Valeurs facultatives :
  - montant_actuel, avec 0 par défaut ;
  - date_echeance, avec null par défaut ;
  - statut, avec "en cours" par défaut.
*/
export const validerCreationObjectif = (
  body
) => {
  const {
    utilisateur_id,
    nom,
    montant_cible,
    montant_actuel = 0,
    date_echeance = null,
    statut = "en cours",
  } = body

  if (
    utilisateur_id === undefined ||
    nom === undefined ||
    montant_cible === undefined
  ) {
    return validationEchouee(
      "utilisateur_id, nom et montant_cible sont obligatoires"
    )
  }

  const utilisateurId = Number(utilisateur_id)
  const montantCible = Number(montant_cible)
  const montantActuel = Number(montant_actuel)

  if (!entierPositifEstValide(utilisateurId)) {
    return validationEchouee(
      "utilisateur_id doit être un nombre entier supérieur à 0"
    )
  }

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

  /*
    date_echeance est facultative.

    Elle peut être :
    - null ;
    - une vraie date au format AAAA-MM-JJ.
  */
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
    utilisateur_id: utilisateurId,
    nom: nom.trim(),
    montant_cible: montantCible,
    montant_actuel: montantActuel,
    date_echeance,
    statut,
  })
}

/*
  Valide les données envoyées lors de la modification
  complète d’un objectif.

  PUT attend toutes les données principales.

  Champs obligatoires :
  - utilisateur_id ;
  - nom ;
  - montant_cible ;
  - montant_actuel ;
  - statut.

  date_echeance peut rester null.
*/
export const validerModificationObjectif = (
  body
) => {
  const {
    utilisateur_id,
    nom,
    montant_cible,
    montant_actuel,
    date_echeance = null,
    statut,
  } = body

  if (
    utilisateur_id === undefined ||
    nom === undefined ||
    montant_cible === undefined ||
    montant_actuel === undefined ||
    statut === undefined
  ) {
    return validationEchouee(
      "utilisateur_id, nom, montant_cible, montant_actuel et statut sont obligatoires"
    )
  }

  const utilisateurId = Number(utilisateur_id)
  const montantCible = Number(montant_cible)
  const montantActuel = Number(montant_actuel)

  if (!entierPositifEstValide(utilisateurId)) {
    return validationEchouee(
      "utilisateur_id doit être un nombre entier supérieur à 0"
    )
  }

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
    utilisateur_id: utilisateurId,
    nom: nom.trim(),
    montant_cible: montantCible,
    montant_actuel: montantActuel,
    date_echeance,
    statut,
  })
}