/*
  CONTRÔLEUR DES BUDGETS

  Depuis Lot 3 :
  - plus de try/catch générique ; asyncHandler transmet
    toute erreur non gérée à erreurGlobale.middleware.js ;
  - les erreurs métier (400, 404, 409) sont levées
    explicitement via ErreurHTTP.

  budget.controller.js → orchestre les requêtes HTTP
  budget.validator.js  → valide les entrées
  budget.service.js    → exécute les requêtes SQL

  Règle de sécurité :
  le client ne choisit jamais utilisateur_id.
*/

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"

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

export const getBudgets = asyncHandler(
  async (request, response) => {
    const validation = validerFiltresBudgets(request.query)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const { categorieId, mois, annee, limite, page, offset } =
      validation.donnees

    const utilisateurId = request.utilisateur.utilisateurId

    const resultat = await findAllBudgets(
      utilisateurId,
      categorieId,
      mois,
      annee,
      limite,
      offset
    )

    if (!pageExiste({ total: resultat.total, page, limite })) {
      const totalPages = calculerTotalPages(resultat.total, limite)

      throw new ErreurHTTP(
        400,
        `La page ${page} n'existe pas. Dernière page disponible : ${totalPages}`
      )
    }

    response.json({
      budgets: resultat.budgets,
      pagination: creerPagination({
        total: resultat.total,
        limite,
        page,
      }),
    })
  }
)

export const getBudgetById = asyncHandler(
  async (request, response) => {
    const validation = validerIdBudget(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const budget = await findBudgetById(
      validation.donnees.id,
      request.utilisateur.utilisateurId
    )

    if (!budget) {
      throw new ErreurHTTP(404, "Budget introuvable")
    }

    response.json(budget)
  }
)

/*
  Crée un budget. Try/catch local conservé : deux erreurs
  pg possibles ici, 23503 (catégorie inexistante) et 23505
  (doublon catégorie + période), chacune avec son message.
*/
export const postBudget = asyncHandler(
  async (request, response) => {
    const validation = validerDonneesBudget(request.body)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    try {
      const nouveauBudget = await createBudget(
        request.utilisateur.utilisateurId,
        validation.donnees
      )

      if (!nouveauBudget) {
        throw new ErreurHTTP(404, "Catégorie introuvable")
      }

      response.status(201).json(nouveauBudget)
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(409, "La catégorie indiquée n'existe pas")
      }

      if (estErreurDoublon(error)) {
        throw new ErreurHTTP(
          409,
          "Un budget existe déjà pour cette catégorie et cette période"
        )
      }

      throw error
    }
  }
)

export const putBudget = asyncHandler(
  async (request, response) => {
    const validationId = validerIdBudget(request.params.id)

    if (!validationId.estValide) {
      throw new ErreurHTTP(400, validationId.message)
    }

    const validationDonnees = validerDonneesBudget(request.body)

    if (!validationDonnees.estValide) {
      throw new ErreurHTTP(400, validationDonnees.message)
    }

    try {
      const budgetModifie = await updateBudget(
        validationId.donnees.id,
        request.utilisateur.utilisateurId,
        validationDonnees.donnees
      )

      if (!budgetModifie) {
        throw new ErreurHTTP(404, "Budget ou catégorie introuvable")
      }

      response.json(budgetModifie)
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(409, "La catégorie indiquée n'existe pas")
      }

      if (estErreurDoublon(error)) {
        throw new ErreurHTTP(
          409,
          "Un budget existe déjà pour cette catégorie et cette période"
        )
      }

      throw error
    }
  }
)

export const deleteBudgetById = asyncHandler(
  async (request, response) => {
    const validation = validerIdBudget(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const budgetSupprime = await deleteBudget(
      validation.donnees.id,
      request.utilisateur.utilisateurId
    )

    if (!budgetSupprime) {
      throw new ErreurHTTP(404, "Budget introuvable")
    }

    response.json({
      message: "Budget supprimé",
      budget: budgetSupprime,
    })
  }
)