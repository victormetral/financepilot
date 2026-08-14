/*
  VALIDATEUR DES RÉCURRENCES

  Contient la validation de l'identifiant et des données
  de création/modification d'une récurrence.

  Utilisé par :
  - recurrence.controller.js

  Utilise :
  - validator.utils.js (forme du résultat)
  - validation.utils.js, date.utils.js (tests unitaires)
  - recurrence.constants.js (listes fermées)

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
  texteEstValide,
  valeurEstAutorisee,
} from "../utils/validation.utils.js"

import {
  TYPES_RECURRENCE_AUTORISES,
  FREQUENCES_AUTORISEES,
  INTERVALLE_MINIMUM,
  INTERVALLE_MAXIMUM,
} from "../constants/recurrence.constants.js"

// ============================================================
// 1. IDENTIFIANT
// ============================================================

export const validerIdRecurrence = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L'identifiant de la récurrence doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({ id: idNombre })
}

// ============================================================
// 2. DONNÉES DE CRÉATION ET DE MODIFICATION
// ============================================================

/*
  Fonction commune au POST et au PUT :
  les deux routes attendent les mêmes données.

  Champs facultatifs et leur valeur par défaut :
  - categorie_id : null
  - date_fin     : null (récurrence sans fin)
  - intervalle   : 1
  - active       : true
*/
export const validerDonneesRecurrence = (body) => {
  const {
    compte_id,
    categorie_id,
    libelle,
    montant,
    type_transaction,
    frequence,
    intervalle,
    date_debut,
    date_fin,
    active,
  } = body

  if (
    compte_id === undefined ||
    libelle === undefined ||
    montant === undefined ||
    type_transaction === undefined ||
    frequence === undefined ||
    date_debut === undefined
  ) {
    return validationEchouee(
      "compte_id, libelle, montant, type_transaction, frequence et date_debut sont obligatoires"
    )
  }

  const compteId = Number(compte_id)

  // categorie_id est facultatif : identifiant valide, null, ou absent.
  const categorieId =
    categorie_id !== undefined && categorie_id !== null
      ? Number(categorie_id)
      : null

  const montantNombre = Number(montant)

  // Absent signifie "toutes les fois", donc un intervalle de 1.
  const intervalleNombre =
    intervalle !== undefined && intervalle !== null
      ? Number(intervalle)
      : 1

  const dateFin =
    date_fin !== undefined && date_fin !== null && date_fin !== ""
      ? date_fin
      : null

  // Une récurrence est active sauf demande explicite du contraire.
  const estActive = active === undefined ? true : Boolean(active)

  // ----------------------------------------------------------
  // Comptes et catégories
  // ----------------------------------------------------------

  if (!entierPositifEstValide(compteId)) {
    return validationEchouee(
      "compte_id doit être un nombre entier supérieur à 0"
    )
  }

  if (categorieId !== null && !entierPositifEstValide(categorieId)) {
    return validationEchouee(
      "categorie_id doit être null ou un nombre entier supérieur à 0"
    )
  }

  // ----------------------------------------------------------
  // Libellé et montant
  // ----------------------------------------------------------

  if (!texteEstValide(libelle)) {
    return validationEchouee("libelle doit être un texte non vide")
  }

  /*
    Comme pour une transaction, le signe du montant porte le
    sens : une dépense est stockée en négatif. On vérifie donc
    seulement qu'il s'agit d'un nombre réel, et on refuse zéro,
    qui générerait des transactions sans effet.
  */
  if (!Number.isFinite(montantNombre) || montantNombre === 0) {
    return validationEchouee(
      "montant doit être un nombre différent de 0"
    )
  }

  // ----------------------------------------------------------
  // Rythme
  // ----------------------------------------------------------

  if (!valeurEstAutorisee(type_transaction, TYPES_RECURRENCE_AUTORISES)) {
    return validationEchouee(
      "type_transaction doit être revenu ou depense"
    )
  }

  if (!valeurEstAutorisee(frequence, FREQUENCES_AUTORISEES)) {
    return validationEchouee(
      "frequence doit être hebdomadaire, mensuelle, trimestrielle ou annuelle"
    )
  }

  if (
    !Number.isInteger(intervalleNombre) ||
    intervalleNombre < INTERVALLE_MINIMUM ||
    intervalleNombre > INTERVALLE_MAXIMUM
  ) {
    return validationEchouee(
      `intervalle doit être un nombre entier entre ${INTERVALLE_MINIMUM} et ${INTERVALLE_MAXIMUM}`
    )
  }

  // ----------------------------------------------------------
  // Dates
  // ----------------------------------------------------------

  if (!dateEstValide(date_debut)) {
    return validationEchouee(
      "date_debut doit être une date valide au format AAAA-MM-JJ"
    )
  }

  if (dateFin !== null && !dateEstValide(dateFin)) {
    return validationEchouee(
      "date_fin doit être null ou une date valide au format AAAA-MM-JJ"
    )
  }

  /*
    La base refuse déjà ce cas via une contrainte CHECK, mais
    une contrainte violée remonte en erreur 500 illisible.
    Le test ici produit un message compréhensible.

    La comparaison de chaînes fonctionne parce que le format
    AAAA-MM-JJ est ordonnable alphabétiquement.
  */
  if (dateFin !== null && dateFin < date_debut) {
    return validationEchouee(
      "date_fin ne peut pas être antérieure à date_debut"
    )
  }

  return validationReussie({
    compte_id: compteId,
    categorie_id: categorieId,
    libelle: libelle.trim(),
    montant: montantNombre,
    type_transaction,
    frequence,
    intervalle: intervalleNombre,
    date_debut,
    date_fin: dateFin,
    active: estActive,
  })
}