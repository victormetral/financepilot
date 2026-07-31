/*
  VALIDATEUR DES BUDGETS

  Ce fichier centralise les règles de validation liées
  aux budgets mensuels de FinancePilot.

  Il est utilisé par :
  - budget.controller.js

  Son rôle :
  - valider les identifiants ;
  - convertir les paramètres reçus sous forme de texte ;
  - valider les filtres GET ;
  - valider les données POST et PUT ;
  - calculer les paramètres nécessaires à la pagination.

  Ce fichier ne doit pas :
  - recevoir directement request ou response ;
  - envoyer de statut HTTP ;
  - exécuter de requête SQL ;
  - connaître le fonctionnement de PostgreSQL.

  Il renvoie toujours un objet indiquant :
  - si la validation a réussi ;
  - les données transformées ;
  - ou le message d’erreur.
*/

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

/*
  Construit le résultat d’une validation réussie.

  Exemple :

  {
    estValide: true,
    donnees: {
      utilisateur_id: 1
    }
  }
*/
const validationReussie = (donnees) => {
  return {
    estValide: true,
    donnees,
  }
}

/*
  Construit le résultat d’une validation échouée.

  Exemple :

  {
    estValide: false,
    message: "mois invalide"
  }
*/
const validationEchouee = (message) => {
  return {
    estValide: false,
    message,
  }
}

/*
  Convertit un paramètre facultatif en nombre.

  Les paramètres présents dans request.query arrivent
  toujours sous forme de texte.

  Exemples :
  "3"       → 3
  undefined → undefined
*/
const convertirNombreFacultatif = (valeur) => {
  return valeur !== undefined
    ? Number(valeur)
    : undefined
}

/*
  Vérifie l’identifiant d’un budget reçu dans l’URL.

  Exemple :
  GET /api/budgets/4

  L’identifiant doit être :
  - un nombre entier ;
  - strictement supérieur à zéro.
*/
export const validerIdBudget = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant du budget doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Valide les filtres de la route :

  GET /api/budgets

  Filtres facultatifs acceptés :
  - utilisateur_id ;
  - categorie_id ;
  - mois ;
  - annee ;
  - limite ;
  - page.

  Exemple :

  /api/budgets?utilisateur_id=1&mois=7&annee=2026
*/
export const validerFiltresBudgets = (
  query
) => {
  const {
    utilisateur_id,
    categorie_id,
    mois,
    annee,
    limite,
    page,
  } = query

  /*
    Chaque filtre numérique facultatif est converti
    uniquement lorsqu’il a été envoyé.
  */
  const utilisateurId =
    convertirNombreFacultatif(utilisateur_id)

  const categorieId =
    convertirNombreFacultatif(categorie_id)

  const moisNombre =
    convertirNombreFacultatif(mois)

  const anneeNombre =
    convertirNombreFacultatif(annee)

  const {
    limiteNombre,
    pageNombre,
  } = convertirPagination({
    limite,
    page,
  })

  if (
    utilisateurId !== undefined &&
    !entierPositifEstValide(utilisateurId)
  ) {
    return validationEchouee(
      "utilisateur_id doit être un nombre entier supérieur à 0"
    )
  }

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

  /*
    L’offset indique au service SQL combien de lignes
    doivent être ignorées avant de commencer la page.

    Exemple :
    page 3 avec une limite de 20
    → offset = 40
  */
  const offset =
    calculerOffset(pageNombre, limiteNombre)

  return validationReussie({
    utilisateurId,
    categorieId,
    mois: moisNombre,
    annee: anneeNombre,
    limite: limiteNombre,
    page: pageNombre,
    offset,
  })
}

/*
  Valide les données nécessaires à la création
  ou à la modification complète d’un budget.

  Cette fonction est commune à :
  - POST /api/budgets ;
  - PUT /api/budgets/:id.

  Champs obligatoires :
  - utilisateur_id ;
  - categorie_id ;
  - montant_limite ;
  - mois ;
  - annee.
*/
export const validerDonneesBudget = (body) => {
  const {
    utilisateur_id,
    categorie_id,
    montant_limite,
    mois,
    annee,
  } = body

  if (
    utilisateur_id === undefined ||
    categorie_id === undefined ||
    montant_limite === undefined ||
    mois === undefined ||
    annee === undefined
  ) {
    return validationEchouee(
      "utilisateur_id, categorie_id, montant_limite, mois et annee sont obligatoires"
    )
  }

  /*
    Les valeurs JSON peuvent être envoyées sous forme
    de nombres ou de textes.

    Number() permet d’obtenir un format numérique commun
    avant la validation.
  */
  const utilisateurId = Number(utilisateur_id)
  const categorieId = Number(categorie_id)
  const montantLimite = Number(montant_limite)
  const moisNombre = Number(mois)
  const anneeNombre = Number(annee)

  if (!entierPositifEstValide(utilisateurId)) {
    return validationEchouee(
      "utilisateur_id doit être un nombre entier supérieur à 0"
    )
  }

  if (!entierPositifEstValide(categorieId)) {
    return validationEchouee(
      "categorie_id doit être un nombre entier supérieur à 0"
    )
  }

  /*
    Un budget doit avoir une limite strictement positive.

    Exemples valides :
    100
    500.50

    Exemples invalides :
    0
    -50
  */
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

  /*
    Le contrôleur recevra directement des données propres
    et prêtes à être transmises au service.
  */
  return validationReussie({
    utilisateur_id: utilisateurId,
    categorie_id: categorieId,
    montant_limite: montantLimite,
    mois: moisNombre,
    annee: anneeNombre,
  })
}