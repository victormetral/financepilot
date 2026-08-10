/*
  VALIDATEUR DES OPÉRATIONS D'INVESTISSEMENT

  Règles de validation liées aux achats, ventes et autres
  opérations financières.

  Utilisé par :
  - operationInvestissement.controller.js

  Ne doit pas : appeler PostgreSQL, utiliser request/response,
  envoyer de statut HTTP.
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
} from "../utils/validation.utils.js"

export const validerIdOperationInvestissement = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L'identifiant de l'opération doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({ id: idNombre })
}

/*
  Fonction interne commune au POST et au PUT.

  fraisObligatoires : POST → facultatif (0 par défaut),
  PUT → obligatoire.
*/
const validerDonneesOperation = (body, { fraisObligatoires }) => {
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
    (fraisObligatoires && frais === undefined)
  ) {
    const message = fraisObligatoires
      ? "compte_id, actif_financier_id, type_operation, quantite, prix_unitaire, frais et date_operation sont obligatoires"
      : "compte_id, actif_financier_id, type_operation, quantite, prix_unitaire et date_operation sont obligatoires"

    return validationEchouee(message)
  }

  // Les données JSON peuvent arriver en texte ; Number() les convertit.
  const compteId = Number(compte_id)
  const actifFinancierId = Number(actif_financier_id)
  const quantiteNombre = Number(quantite)
  const prixUnitaireNombre = Number(prix_unitaire)
  const fraisNombre = frais === undefined ? 0 : Number(frais)

  if (!entierPositifEstValide(compteId)) {
    return validationEchouee("compte_id doit être un nombre entier supérieur à 0")
  }

  if (!entierPositifEstValide(actifFinancierId)) {
    return validationEchouee(
      "actif_financier_id doit être un nombre entier supérieur à 0"
    )
  }

  if (!texteEstValide(type_operation)) {
    return validationEchouee("type_operation doit être un texte non vide")
  }

  if (!nombrePositifEstValide(quantiteNombre)) {
    return validationEchouee("quantite doit être un nombre supérieur à 0")
  }

  // Le prix unitaire et les frais peuvent être à 0, mais pas négatifs.
  if (!nombrePositifOuNulEstValide(prixUnitaireNombre)) {
    return validationEchouee(
      "prix_unitaire doit être un nombre supérieur ou égal à 0"
    )
  }

  if (!nombrePositifOuNulEstValide(fraisNombre)) {
    return validationEchouee("frais doit être un nombre supérieur ou égal à 0")
  }

  if (!dateEstValide(date_operation)) {
    return validationEchouee(
      "date_operation doit être une date valide au format AAAA-MM-JJ"
    )
  }

  return validationReussie({
    compte_id: compteId,
    actif_financier_id: actifFinancierId,
    type_operation: type_operation.trim().toLowerCase(),
    quantite: quantiteNombre,
    prix_unitaire: prixUnitaireNombre,
    frais: fraisNombre,
    date_operation,
  })
}

export const validerCreationOperationInvestissement = (body) => {
  return validerDonneesOperation(body, { fraisObligatoires: false })
}

export const validerModificationOperationInvestissement = (body) => {
  return validerDonneesOperation(body, { fraisObligatoires: true })
}