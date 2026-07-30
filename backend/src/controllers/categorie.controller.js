import {
  findAllCategories,
  findCategorieById,
  createCategorie,
  updateCategorie,
  deleteCategorie,
} from "../services/categorie.service.js"

export const getCategories = async (request, response) => {
  try {
    const categories = await findAllCategories()

    response.json(categories)
  } catch (error) {
    response.status(500).json({
      message: "Erreur lors de la récupération des catégories",
      error: error.message,
    })
  }
}

export const getCategorieById = async (request, response) => {
  try {
    const categorie = await findCategorieById(request.params.id)

    if (!categorie) {
      return response.status(404).json({
        message: "Catégorie introuvable",
      })
    }

    response.json(categorie)
  } catch (error) {
    response.status(500).json({
      message: "Erreur lors de la récupération de la catégorie",
      error: error.message,
    })
  }
}

export const postCategorie = async (request, response) => {
  try {
    const {
      utilisateur_id,
      nom,
      type_categorie,
    } = request.body

    if (!utilisateur_id || !nom || !type_categorie) {
      return response.status(400).json({
        message:
          "utilisateur_id, nom et type_categorie sont obligatoires",
      })
    }

    const nouvelleCategorie = await createCategorie({
      utilisateur_id,
      nom,
      type_categorie,
    })

    response.status(201).json(nouvelleCategorie)
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        message:
          "Cette catégorie existe déjà pour cet utilisateur",
      })
    }

    response.status(500).json({
      message: "Erreur lors de la création de la catégorie",
      error: error.message,
    })
  }
}

export const putCategorie = async (request, response) => {
  try {
    const {
      nom,
      type_categorie,
    } = request.body

    if (!nom || !type_categorie) {
      return response.status(400).json({
        message:
          "nom et type_categorie sont obligatoires",
      })
    }

    const categorieModifiee = await updateCategorie(
      request.params.id,
      {
        nom,
        type_categorie,
      }
    )

    if (!categorieModifiee) {
      return response.status(404).json({
        message: "Catégorie introuvable",
      })
    }

    response.json(categorieModifiee)
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        message:
          "Cette catégorie existe déjà pour cet utilisateur",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de la catégorie",
      error: error.message,
    })
  }
}

export const removeCategorie = async (request, response) => {
  try {
    const categorieSupprimee = await deleteCategorie(
      request.params.id
    )

    if (!categorieSupprimee) {
      return response.status(404).json({
        message: "Catégorie introuvable",
      })
    }

    response.json({
      message: "Catégorie supprimée avec succès",
      categorie: categorieSupprimee,
    })
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Impossible de supprimer cette catégorie car elle est encore utilisée dans des transactions ou des budgets",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la suppression de la catégorie",
      error: error.message,
    })
  }
}