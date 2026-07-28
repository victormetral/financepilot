import {
  findAllComptes,
  createCompte,
  findCompteById,
  updateCompte,
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
    const compteModifie = await updateCompte(
      request.params.id,
      request.body
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