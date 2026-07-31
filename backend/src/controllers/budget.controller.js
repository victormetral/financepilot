import {
  findAllBudgets,
  findBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
} from "../services/budget.service.js"

export const getBudgets = async (
  request,
  response
) => {
  try {
    const {
      utilisateur_id,
      categorie_id,
      mois,
      annee,
      limite,
      page,
    } = request.query

    const utilisateurIdNombre =
      utilisateur_id !== undefined
        ? Number(utilisateur_id)
        : undefined

    const categorieIdNombre =
      categorie_id !== undefined
        ? Number(categorie_id)
        : undefined

    const moisNombre =
      mois !== undefined
        ? Number(mois)
        : undefined

    const anneeNombre =
      annee !== undefined
        ? Number(annee)
        : undefined

    const limiteNombre =
      limite !== undefined
        ? Number(limite)
        : 20

    const pageNombre =
      page !== undefined
        ? Number(page)
        : 1

    if (
      utilisateurIdNombre !== undefined &&
      (
        !Number.isInteger(utilisateurIdNombre) ||
        utilisateurIdNombre <= 0
      )
    ) {
      return response.status(400).json({
        message:
          "utilisateur_id doit être un nombre entier supérieur à 0",
      })
    }

    if (
      categorieIdNombre !== undefined &&
      (
        !Number.isInteger(categorieIdNombre) ||
        categorieIdNombre <= 0
      )
    ) {
      return response.status(400).json({
        message:
          "categorie_id doit être un nombre entier supérieur à 0",
      })
    }

    if (
      moisNombre !== undefined &&
      (
        !Number.isInteger(moisNombre) ||
        moisNombre < 1 ||
        moisNombre > 12
      )
    ) {
      return response.status(400).json({
        message:
          "mois doit être un nombre entier compris entre 1 et 12",
      })
    }

    if (
      anneeNombre !== undefined &&
      (
        !Number.isInteger(anneeNombre) ||
        anneeNombre < 2000 ||
        anneeNombre > 2100
      )
    ) {
      return response.status(400).json({
        message:
          "annee doit être un nombre entier compris entre 2000 et 2100",
      })
    }

    if (
      !Number.isInteger(limiteNombre) ||
      limiteNombre < 1 ||
      limiteNombre > 100
    ) {
      return response.status(400).json({
        message:
          "limite doit être un nombre entier compris entre 1 et 100",
      })
    }

    if (
      !Number.isInteger(pageNombre) ||
      pageNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "page doit être un nombre entier supérieur à 0",
      })
    }

    const offsetNombre =
      (pageNombre - 1) * limiteNombre

    const resultat = await findAllBudgets(
      utilisateurIdNombre,
      categorieIdNombre,
      moisNombre,
      anneeNombre,
      limiteNombre,
      offsetNombre
    )

    const totalPages =
      Math.ceil(resultat.total / limiteNombre)

    if (
      resultat.total > 0 &&
      pageNombre > totalPages
    ) {
      return response.status(400).json({
        message: `La page ${pageNombre} n’existe pas. Dernière page disponible : ${totalPages}`,
      })
    }

    const pagePrecedente =
      pageNombre > 1

    const pageSuivante =
      pageNombre < totalPages

    const numeroPagePrecedente =
      pagePrecedente
        ? pageNombre - 1
        : null

    const numeroPageSuivante =
      pageSuivante
        ? pageNombre + 1
        : null

    response.json({
      budgets: resultat.budgets,
      pagination: {
        total: resultat.total,
        limite: limiteNombre,
        page: pageNombre,
        total_pages: totalPages,

        has_previous: pagePrecedente,

        has_next: pageSuivante,

        previous_page: numeroPagePrecedente,

        next_page: numeroPageSuivante,
      },
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
    const budgetIdNombre = Number(request.params.id)

    if (
      !Number.isInteger(budgetIdNombre) ||
      budgetIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant du budget doit être un nombre entier supérieur à 0",
      })
    }

    const budget = await findBudgetById(
      budgetIdNombre
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
    const {
      utilisateur_id,
      categorie_id,
      montant_maximum,
      mois,
      annee,
    } = request.body

    if (
      utilisateur_id === undefined ||
      categorie_id === undefined ||
      montant_maximum === undefined ||
      mois === undefined ||
      annee === undefined
    ) {
      return response.status(400).json({
        message:
          "utilisateur_id, categorie_id, montant_maximum, mois et annee sont obligatoires",
      })
    }

    const utilisateurIdNombre =
      Number(utilisateur_id)

    const categorieIdNombre =
      Number(categorie_id)

    const montantMaximumNombre =
      Number(montant_maximum)

    const moisNombre = Number(mois)
    const anneeNombre = Number(annee)

    if (
      !Number.isInteger(utilisateurIdNombre) ||
      utilisateurIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "utilisateur_id doit être un nombre entier supérieur à 0",
      })
    }

    if (
      !Number.isInteger(categorieIdNombre) ||
      categorieIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "categorie_id doit être un nombre entier supérieur à 0",
      })
    }

    if (
      !Number.isFinite(montantMaximumNombre) ||
      montantMaximumNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "montant_maximum doit être un nombre supérieur à 0",
      })
    }

    if (
      !Number.isInteger(moisNombre) ||
      moisNombre < 1 ||
      moisNombre > 12
    ) {
      return response.status(400).json({
        message:
          "mois doit être un nombre entier compris entre 1 et 12",
      })
    }

    if (
      !Number.isInteger(anneeNombre) ||
      anneeNombre < 2000 ||
      anneeNombre > 2100
    ) {
      return response.status(400).json({
        message:
          "annee doit être un nombre entier compris entre 2000 et 2100",
      })
    }

    const nouveauBudget = await createBudget({
      utilisateur_id: utilisateurIdNombre,
      categorie_id: categorieIdNombre,
      montant_maximum: montantMaximumNombre,
      mois: moisNombre,
      annee: anneeNombre,
    })

    response.status(201).json(nouveauBudget)
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "L’utilisateur ou la catégorie indiqué n’existe pas",
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
    const budgetIdNombre = Number(request.params.id)

    if (
      !Number.isInteger(budgetIdNombre) ||
      budgetIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant du budget doit être un nombre entier supérieur à 0",
      })
    }

    const {
      utilisateur_id,
      categorie_id,
      montant_maximum,
      mois,
      annee,
    } = request.body

    if (
      utilisateur_id === undefined ||
      categorie_id === undefined ||
      montant_maximum === undefined ||
      mois === undefined ||
      annee === undefined
    ) {
      return response.status(400).json({
        message:
          "utilisateur_id, categorie_id, montant_maximum, mois et annee sont obligatoires",
      })
    }

    const utilisateurIdNombre =
      Number(utilisateur_id)

    const categorieIdNombre =
      Number(categorie_id)

    const montantMaximumNombre =
      Number(montant_maximum)

    const moisNombre = Number(mois)
    const anneeNombre = Number(annee)

    if (
      !Number.isInteger(utilisateurIdNombre) ||
      utilisateurIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "utilisateur_id doit être un nombre entier supérieur à 0",
      })
    }

    if (
      !Number.isInteger(categorieIdNombre) ||
      categorieIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "categorie_id doit être un nombre entier supérieur à 0",
      })
    }

    if (
      !Number.isFinite(montantMaximumNombre) ||
      montantMaximumNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "montant_maximum doit être un nombre supérieur à 0",
      })
    }

    if (
      !Number.isInteger(moisNombre) ||
      moisNombre < 1 ||
      moisNombre > 12
    ) {
      return response.status(400).json({
        message:
          "mois doit être un nombre entier compris entre 1 et 12",
      })
    }

    if (
      !Number.isInteger(anneeNombre) ||
      anneeNombre < 2000 ||
      anneeNombre > 2100
    ) {
      return response.status(400).json({
        message:
          "annee doit être un nombre entier compris entre 2000 et 2100",
      })
    }

    const budgetModifie = await updateBudget(
      budgetIdNombre,
      {
        utilisateur_id: utilisateurIdNombre,
        categorie_id: categorieIdNombre,
        montant_maximum: montantMaximumNombre,
        mois: moisNombre,
        annee: anneeNombre,
      }
    )

    if (!budgetModifie) {
      return response.status(404).json({
        message: "Budget introuvable",
      })
    }

    response.json(budgetModifie)
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "L’utilisateur ou la catégorie indiqué n’existe pas",
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
    const budgetIdNombre = Number(request.params.id)

    if (
      !Number.isInteger(budgetIdNombre) ||
      budgetIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant du budget doit être un nombre entier supérieur à 0",
      })
    }

    const budgetSupprime = await deleteBudget(
      budgetIdNombre
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