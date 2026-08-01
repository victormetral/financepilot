/*
  CONTRÔLEUR DES BUDGETS

  Ce fichier orchestre les requêtes HTTP liées aux budgets.

  Il doit rester simple :
  - récupérer les données de la requête ;
  - appeler budget.validator.js ;
  - appeler budget.service.js ;
  - renvoyer la réponse HTTP.

  Répartition des responsabilités :

  budget.controller.js
  → orchestre les requêtes HTTP

  budget.validator.js
  → valide et transforme les données

  budget.service.js
  → exécute les requêtes SQL

  pagination.utils.js
  → calcule les informations de pagination

  Victor :
  si une règle concernant les mois, les années,
  les montants ou les identifiants change,
  modifie d’abord budget.validator.js.
*/

import {
  estErreurCleEtrangere,
  estErreurDoublon,
} from "../utils/postgres.utils.js"

import {
  findAllBudgets,
  findBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../services/budget.service.js"

// 🟨 NOUVEAU : validations déplacées hors du contrôleur
import {
  validerFiltresBudgets,
  validerIdBudget,
  validerDonneesBudget,
} from "../validators/budget.validator.js"

// 🟨 NOUVEAU : calculs de pagination centralisés
import {
  creerPagination,
  pageExiste,
  calculerTotalPages,
} from "../utils/pagination.utils.js"

/*
  Récupère les budgets avec des filtres facultatifs
  et une pagination.

  Exemple :
  GET /api/budgets?utilisateur_id=1&mois=7&page=1
*/
export const getBudgets = async (
  request,
  response
) => {
  try {
    /*
      request.query contient les paramètres placés
      après le point d’interrogation dans l’URL.

      Le validateur :
      - convertit les textes en nombres ;
      - vérifie les filtres ;
      - calcule l’offset.
    */
    const validation =
      validerFiltresBudgets(request.query)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const {
      utilisateurId,
      categorieId,
      mois,
      annee,
      limite,
      page,
      offset,
    } = validation.donnees

    /*
      Le service récupère :
      - les budgets de la page demandée ;
      - le nombre total de budgets correspondants.

      La pagination complète est ensuite construite
      dans le contrôleur.
    */
    const resultat = await findAllBudgets(
      utilisateurId,
      categorieId,
      mois,
      annee,
      limite,
      offset
    )

    /*
      Une page inexistante est refusée.

      Exemple :
      - 3 pages disponibles ;
      - page 20 demandée.
    */
    if (
      !pageExiste({
        total: resultat.total,
        page,
        limite,
      })
    ) {
      const totalPages =
        calculerTotalPages(
          resultat.total,
          limite
        )

      return response.status(400).json({
        message:
          `La page ${page} n’existe pas. ` +
          `Dernière page disponible : ${totalPages}`,
      })
    }

    response.json({
      budgets: resultat.budgets,

      /*
        creerPagination() renvoie notamment :
        - total ;
        - limite ;
        - offset ;
        - page ;
        - total_pages ;
        - previous_page ;
        - next_page.
      */
      pagination: creerPagination({
        total: resultat.total,
        limite,
        page,
      }),
    })
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des budgets",
      error: error.message,
    })
  }
}

/*
  Récupère un budget précis grâce à l’identifiant
  placé dans l’URL.

  Exemple :
  GET /api/budgets/3
*/
export const getBudgetById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdBudget(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const budget = await findBudgetById(
      validation.donnees.id
    )

    if (!budget) {
      return response.status(404).json({
        message: "Budget introuvable",
      })
    }

    response.json(budget)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération du budget",
      error: error.message,
    })
  }
}

/*
  Crée un nouveau budget.

  Le validateur vérifie :
  - utilisateur_id ;
  - categorie_id ;
  - montant_limite ;
  - mois ;
  - annee.

  Les données validées sont directement transmises
  au service.
*/
export const postBudget = async (
  request,
  response
) => {
  try {
    const validation =
      validerDonneesBudget(request.body)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const nouveauBudget =
      await createBudget(validation.donnees)

    response.status(201).json(nouveauBudget)
  } catch (error) {
    /*
      PostgreSQL 23503 :
      une clé étrangère ne correspond à aucune ligne.

      Ici, cela signifie généralement que :
      - l’utilisateur n’existe pas ;
      - ou la catégorie n’existe pas.
    */
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "L’utilisateur ou la catégorie indiqué n’existe pas",
      })
    }

    /*
      PostgreSQL 23505 :
      une contrainte d’unicité a été violée.

      Cela peut arriver si la base interdit plusieurs
      budgets identiques pour une même catégorie,
      un même utilisateur, un même mois et une même année.
    */
    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Un budget existe déjà pour cette catégorie et cette période",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création du budget",
      error: error.message,
    })
  }
}

/*
  Modifie entièrement un budget existant.

  PUT attend toutes les données principales du budget.
  Pour une modification partielle, une route PATCH
  serait plus adaptée.
*/
export const putBudget = async (
  request,
  response
) => {
  try {
    /*
      L’identifiant de l’URL et les données JSON
      sont validés séparément.
    */
    const validationId =
      validerIdBudget(request.params.id)

    if (!validationId.estValide) {
      return response.status(400).json({
        message: validationId.message,
      })
    }

    const validationDonnees =
      validerDonneesBudget(request.body)

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message: validationDonnees.message,
      })
    }

    const budgetModifie = await updateBudget(
      validationId.donnees.id,
      validationDonnees.donnees
    )

    /*
      Le service renvoie null ou undefined
      lorsqu’aucun budget ne correspond à l’identifiant.
    */
    if (!budgetModifie) {
      return response.status(404).json({
        message: "Budget introuvable",
      })
    }

    response.json(budgetModifie)
  } catch (error) {
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message:
          "L’utilisateur ou la catégorie indiqué n’existe pas",
      })
    }

    if (estErreurDoublon(error)) {
      return response.status(409).json({
        message:
          "Un budget existe déjà pour cette catégorie et cette période",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification du budget",
      error: error.message,
    })
  }
}

/*
  Supprime un budget grâce à son identifiant.

  Le service renvoie le budget supprimé grâce
  à la clause SQL RETURNING *.
*/
export const deleteBudgetById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdBudget(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const budgetSupprime =
      await deleteBudget(
        validation.donnees.id
      )

    if (!budgetSupprime) {
      return response.status(404).json({
        message: "Budget introuvable",
      })
    }

    response.json({
      message: "Budget supprimé",
      budget: budgetSupprime,
    })
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la suppression du budget",
      error: error.message,
    })
  }
}