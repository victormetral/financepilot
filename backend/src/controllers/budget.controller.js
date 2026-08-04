/*
  CONTRÔLEUR DES BUDGETS

  Utilise :
  - budget.validator.js pour valider les entrées ;
  - budget.service.js pour PostgreSQL ;
  - request.utilisateur pour l'identité du JWT.

  Règle de sécurité :
  le client ne choisit jamais utilisateur_id.
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

import {
  validerFiltresBudgets,
  validerIdBudget,
  validerDonneesBudget,
} from "../validators/budget.validator.js"

import {
  creerPagination,
  pageExiste,
  calculerTotalPages,
} from "../utils/pagination.utils.js"

export const getBudgets = async (
  request,
  response
) => {
  try {
    const validation =
      validerFiltresBudgets(request.query)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const {
      categorieId,
      mois,
      annee,
      limite,
      page,
      offset,
    } = validation.donnees

    // 🟨 NOUVEAU : identité sûre issue du JWT.
    const utilisateurId =
      request.utilisateur.utilisateurId

    const resultat = await findAllBudgets(
      utilisateurId,
      categorieId,
      mois,
      annee,
      limite,
      offset
    )

    if (
      !pageExiste({
        total: resultat.total,
        page,
        limite,
      })
    ) {
      const totalPages = calculerTotalPages(
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

    // 🟨 CORRIGÉ : recherche limitée au propriétaire.
    const budget = await findBudgetById(
      validation.donnees.id,
      request.utilisateur.utilisateurId
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

    // 🟨 CORRIGÉ : le propriétaire vient du JWT.
    const nouveauBudget = await createBudget(
      request.utilisateur.utilisateurId,
      validation.donnees
    )

    if (!nouveauBudget) {
      return response.status(404).json({
        message: "Catégorie introuvable",
      })
    }

    response.status(201).json(nouveauBudget)
  } catch (error) {
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message: "La catégorie indiquée n’existe pas",
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
        "Erreur lors de la création du budget",
      error: error.message,
    })
  }
}

export const putBudget = async (
  request,
  response
) => {
  try {
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

    // 🟨 CORRIGÉ : propriétaire et catégorie contrôlés.
    const budgetModifie = await updateBudget(
      validationId.donnees.id,
      request.utilisateur.utilisateurId,
      validationDonnees.donnees
    )

    if (!budgetModifie) {
      return response.status(404).json({
        message:
          "Budget ou catégorie introuvable",
      })
    }

    response.json(budgetModifie)
  } catch (error) {
    if (estErreurCleEtrangere(error)) {
      return response.status(409).json({
        message: "La catégorie indiquée n’existe pas",
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

    // 🟨 CORRIGÉ : suppression limitée au propriétaire.
    const budgetSupprime = await deleteBudget(
      validation.donnees.id,
      request.utilisateur.utilisateurId
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
