import {
  findAllComptes,
  createCompte,
  findCompteById,
  updateCompte,
  deleteCompte,
} from "../services/compte.service.js"

export const getComptes = async (request, response) => {
  try {
    const comptes = await findAllComptes()

    response.json(comptes)
  } catch (error) {
    response.status(500).json({
      message: "Erreur lors de la récupération des comptes",
      error: error.message,
    })
  }
}

export const postCompte = async (request, response) => {
  try {
    const {
      utilisateur_id,
      nom,
      type_compte,
      solde_initial,
      devise,
    } = request.body

    if (!utilisateur_id || !nom || !type_compte) {
      return response.status(400).json({
        message:
          "utilisateur_id, nom et type_compte sont obligatoires",
      })
    }

    const nouveauCompte = await createCompte({
      utilisateur_id,
      nom,
      type_compte,
      solde_initial: solde_initial ?? 0,
      devise: devise ?? "EUR",
    })

    response.status(201).json(nouveauCompte)
  } catch (error) {
    response.status(500).json({
      message: "Erreur lors de la création du compte",
      error: error.message,
    })
  }
}

export const getCompteById = async (request, response) => {
  try {
    const compte = await findCompteById(request.params.id)

    if (!compte) {
      return response.status(404).json({
        message: "Compte introuvable",
      })
    }

    response.json(compte)
  } catch (error) {
    response.status(500).json({
      message: "Erreur lors de la récupération du compte",
      error: error.message,
    })
  }
}

export const putCompte = async (request, response) => {
  try {
    const {
      nom,
      type_compte,
      solde_initial,
      devise,
    } = request.body

    if (
      !nom ||
      !type_compte ||
      solde_initial === undefined ||
      !devise
    ) {
      return response.status(400).json({
        message:
          "nom, type_compte, solde_initial et devise sont obligatoires",
      })
    }

    const compteModifie = await updateCompte(
      request.params.id,
      {
        nom,
        type_compte,
        solde_initial,
        devise,
      }
    )

    if (!compteModifie) {
      return response.status(404).json({
        message: "Compte introuvable",
      })
    }

    response.json(compteModifie)
  } catch (error) {
    response.status(500).json({
      message: "Erreur lors de la modification du compte",
      error: error.message,
    })
  }
}

export const removeCompte = async (request, response) => {
  try {
    const compteSupprime = await deleteCompte(request.params.id)

    if (!compteSupprime) {
      return response.status(404).json({
        message: "Compte introuvable",
      })
    }

    response.json({
      message: "Compte supprimé avec succès",
      compte: compteSupprime,
    })
    } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Impossible de supprimer ce compte car il contient encore des transactions ou des opérations d’investissement",
      })
    }

    response.status(500).json({
      message: "Erreur lors de la suppression du compte",
      error: error.message,
    })
  }
}
