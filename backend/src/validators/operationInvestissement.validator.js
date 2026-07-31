/*
  VALIDATEUR DES OPÉRATIONS D’INVESTISSEMENT

  Ce fichier centralise les règles de validation liées
  aux achats, ventes et autres opérations financières.

  Utilisé par :
  - operationInvestissement.controller.js

  Son rôle :
  - valider les identifiants ;
  - vérifier les champs obligatoires ;
  - convertir les textes numériques en nombres ;
  - valider les montants et la date ;
  - nettoyer type_operation.

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
} from "../utils/validation.utils.js"

/*
  Construit une validation réussie.
*/
const validationReussie = (donnees) => {
  return {
    estValide: true,
    donnees,
  }
}

/*
  Construit une validation échouée.
*/
const validationEchouee = (message) => {
  return {
    estValide: false,
    message,
  }
}

/*
  Vérifie l’identifiant d’une opération reçu dans l’URL.

  Exemple :
  GET /api/operations-investissement/3
*/
export const validerIdOperationInvestissement = (
  id
) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant de l’opération doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Fonction interne commune au POST et au PUT.

  Le paramètre fraisObligatoires permet de conserver
  la différence actuelle :

  POST
  → frais facultatifs, avec 0 par défaut

  PUT
  → frais obligatoires
*/
const validerDonneesOperation = (
  body,
  {
    fraisObligatoires,
  }
) => {
  const {
    compte_id,
    actif_financier_id,
    type_operation,
    quantite,
    prix_unitaire,
    frais,
    date_operation,
  } = body

  if (
    compte_id === undefined ||
    actif_financier_id === undefined ||
    type_operation === undefined ||
    quantite === undefined ||
    prix_unitaire === undefined ||
    date_operation === undefined ||
    (
      fraisObligatoires &&
      frais === undefined
    )
  ) {
    const message = fraisObligatoires
      ? "compte_id, actif_financier_id, type_operation, quantite, prix_unitaire, frais et date_operation sont obligatoires"
      : "compte_id, actif_financier_id, type_operation, quantite, prix_unitaire et date_operation sont obligatoires"

    return validationEchouee(message)
  }

  /*
    Les données JSON peuvent arriver sous forme
    de nombres ou de textes.

    Number() les transforme avant validation.
  */
  const compteId = Number(compte_id)

  const actifFinancierId =
    Number(actif_financier_id)

  const quantiteNombre = Number(quantite)

  const prixUnitaireNombre =
    Number(prix_unitaire)

  /*
    Au POST, l’absence de frais donne 0.
    Au PUT, les frais ont déjà été exigés plus haut.
  */
  const fraisNombre =
    frais === undefined
      ? 0
      : Number(frais)

  if (!entierPositifEstValide(compteId)) {
    return validationEchouee(
      "compte_id doit être un nombre entier supérieur à 0"
    )
  }

  if (
    !entierPositifEstValide(
      actifFinancierId
    )
  ) {
    return validationEchouee(
      "actif_financier_id doit être un nombre entier supérieur à 0"
    )
  }

  if (!texteEstValide(type_operation)) {
    return validationEchouee(
      "type_operation doit être un texte non vide"
    )
  }

  /*
    La quantité doit être strictement positive.

    Exemples valides :
    1
    0.25
    15.5
  */
  if (!nombrePositifEstValide(quantiteNombre)) {
    return validationEchouee(
      "quantite doit être un nombre supérieur à 0"
    )
  }

  /*
    Le prix unitaire peut être égal à zéro,
    mais il ne peut pas être négatif.
  */
  if (
    !nombrePositifOuNulEstValide(
      prixUnitaireNombre
    )
  ) {
    return validationEchouee(
      "prix_unitaire doit être un nombre supérieur ou égal à 0"
    )
  }

  /*
    Les frais peuvent être égaux à zéro,
    mais ils ne peuvent pas être négatifs.
  */
  if (
    !nombrePositifOuNulEstValide(
      fraisNombre
    )
  ) {
    return validationEchouee(
      "frais doit être un nombre supérieur ou égal à 0"
    )
  }

  if (!dateEstValide(date_operation)) {
    return validationEchouee(
      "date_operation doit être une date valide au format AAAA-MM-JJ"
    )
  }

  /*
    Les données sont renvoyées sous une forme propre,
    directement utilisable par le service.
  */
  return validationReussie({
    compte_id: compteId,
    actif_financier_id: actifFinancierId,
    type_operation:
      type_operation.trim().toLowerCase(),
    quantite: quantiteNombre,
    prix_unitaire: prixUnitaireNombre,
    frais: fraisNombre,
    date_operation,
  })
}

/*
  Valide la création d’une opération.

  Au POST :
  - frais est facultatif ;
  - sa valeur par défaut est 0.
*/
export const validerCreationOperationInvestissement =
  (body) => {
    return validerDonneesOperation(body, {
      fraisObligatoires: false,
    })
  }

/*
  Valide la modification complète d’une opération.

  Au PUT :
  - frais est obligatoire ;
  - tous les autres champs principaux le sont également.
*/
export const validerModificationOperationInvestissement =
  (body) => {
    return validerDonneesOperation(body, {
      fraisObligatoires: true,
    })
  }