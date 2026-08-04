/*
  VALIDATEUR DES BUDGETS

  Utilisé par :
  - budget.controller.js

  Règle de sécurité :
  utilisateur_id ne vient plus du JSON ni de l'URL.
  Il est lu dans le JWT par le contrôleur.
*/

import {
  validationReussie,
  validationEchouee,
} from "../utils/validator.utils.js"

import {
  entierPositifEstValide,
  nombrePositifEstValide,
  moisEstValide,
  anneeEstValide,
} from "../utils/validation.utils.js"

import {
  convertirPagination,
  limiteEstValide,
  pageEstValide,
  calculerOffset,
} from "../utils/pagination.utils.js"

const convertirNombreFacultatif = (valeur) => {
  return valeur !== undefined
    ? Number(valeur)
    : undefined
}

export const validerIdBudget = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant du budget doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({ id: idNombre })
}

/*
  Valide uniquement les filtres métier.

  🟨 CORRIGÉ :
  utilisateur_id n'est plus un filtre accepté.
  Un utilisateur reçoit toujours ses propres budgets.
*/
export const validerFiltresBudgets = (query) => {
  const {
    categorie_id,
    mois,
    annee,
    limite,
    page,
  } = query

  const categorieId =
    convertirNombreFacultatif(categorie_id)

  const moisNombre =
    convertirNombreFacultatif(mois)

  const anneeNombre =
    convertirNombreFacultatif(annee)

  const {
    limiteNombre,
    pageNombre,
  } = convertirPagination({ limite, page })

  if (
    categorieId !== undefined &&
    !entierPositifEstValide(categorieId)
  ) {
    return validationEchouee(
      "categorie_id doit être un nombre entier supérieur à 0"
    )
  }

  if (
    moisNombre !== undefined &&
    !moisEstValide(moisNombre)
  ) {
    return validationEchouee(
      "mois doit être un nombre entier compris entre 1 et 12"
    )
  }

  if (
    anneeNombre !== undefined &&
    !anneeEstValide(anneeNombre)
  ) {
    return validationEchouee(
      "annee doit être un nombre entier compris entre 2000 et 2100"
    )
  }

  if (!limiteEstValide(limiteNombre)) {
    return validationEchouee(
      "limite doit être un nombre entier compris entre 1 et 100"
    )
  }

  if (!pageEstValide(pageNombre)) {
    return validationEchouee(
      "page doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    categorieId,
    mois: moisNombre,
    annee: anneeNombre,
    limite: limiteNombre,
    page: pageNombre,
    offset: calculerOffset(
      pageNombre,
      limiteNombre
    ),
  })
}

/*
  🟨 CORRIGÉ :
  utilisateur_id a été retiré des données attendues.
  Le client ne choisit jamais le propriétaire.
*/
export const validerDonneesBudget = (body) => {
  const {
    categorie_id,
    montant_limite,
    mois,
    annee,
  } = body

  if (
    categorie_id === undefined ||
    montant_limite === undefined ||
    mois === undefined ||
    annee === undefined
  ) {
    return validationEchouee(
      "categorie_id, montant_limite, mois et annee sont obligatoires"
    )
  }

  const categorieId = Number(categorie_id)
  const montantLimite = Number(montant_limite)
  const moisNombre = Number(mois)
  const anneeNombre = Number(annee)

  if (!entierPositifEstValide(categorieId)) {
    return validationEchouee(
      "categorie_id doit être un nombre entier supérieur à 0"
    )
  }

  if (!nombrePositifEstValide(montantLimite)) {
    return validationEchouee(
      "montant_limite doit être un nombre supérieur à 0"
    )
  }

  if (!moisEstValide(moisNombre)) {
    return validationEchouee(
      "mois doit être un nombre entier compris entre 1 et 12"
    )
  }

  if (!anneeEstValide(anneeNombre)) {
    return validationEchouee(
      "annee doit être un nombre entier compris entre 2000 et 2100"
    )
  }

  return validationReussie({
    categorie_id: categorieId,
    montant_limite: montantLimite,
    mois: moisNombre,
    annee: anneeNombre,
  })
}
