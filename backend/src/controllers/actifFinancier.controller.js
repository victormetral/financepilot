import {
  findAllActifsFinanciers,
  findActifFinancierById,
  createActifFinancier,
  updateActifFinancier,
  deleteActifFinancier,
} from "../services/actifFinancier.service.js"

// Types d’actifs autorisés
const typesActifsAutorises = [
  "action",
  "etf",
  "crypto",
  "obligation",
  "fonds",
  "immobilier",
  "autre",
]

// Vérifier qu’un texte n’est pas vide
const texteEstValide = (texte) => {
  return (
    typeof texte === "string" &&
    texte.trim().length > 0
  )
}

// Récupérer tous les actifs financiers
export const getActifsFinanciers = async (
  request,
  response
) => {
  try {
    const actifs =
      await findAllActifsFinanciers()

    response.json(actifs)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des actifs financiers",
      error: error.message,
    })
  }
}

// Récupérer un actif financier par son identifiant
export const getActifFinancierById = async (
  request,
  response
) => {
  try {
    const actifIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(actifIdNombre) ||
      actifIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’actif financier doit être un nombre entier supérieur à 0",
      })
    }

    const actif =
      await findActifFinancierById(
        actifIdNombre
      )

    if (!actif) {
      return response.status(404).json({
        message:
          "Actif financier introuvable",
      })
    }

    response.json(actif)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de l’actif financier",
      error: error.message,
    })
  }
}

// Créer un actif financier
export const postActifFinancier = async (
  request,
  response
) => {
  try {
    const {
      symbole,
      nom,
      type_actif,
      devise = "EUR",
    } = request.body

    if (
      symbole === undefined ||
      nom === undefined ||
      type_actif === undefined
    ) {
      return response.status(400).json({
        message:
          "symbole, nom et type_actif sont obligatoires",
      })
    }

    if (!texteEstValide(symbole)) {
      return response.status(400).json({
        message:
          "symbole doit être un texte non vide",
      })
    }

    if (!texteEstValide(nom)) {
      return response.status(400).json({
        message:
          "nom doit être un texte non vide",
      })
    }

    if (
      !typesActifsAutorises.includes(
        type_actif
      )
    ) {
      return response.status(400).json({
        message:
          "type_actif doit être action, etf, crypto, obligation, fonds, immobilier ou autre",
      })
    }

    if (!texteEstValide(devise)) {
      return response.status(400).json({
        message:
          "devise doit être un texte non vide",
      })
    }

    const nouvelActif =
      await createActifFinancier({
        symbole: symbole
          .trim()
          .toUpperCase(),
        nom: nom.trim(),
        type_actif,
        devise: devise
          .trim()
          .toUpperCase(),
      })

    response.status(201).json(nouvelActif)
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        message:
          "Cet actif financier existe déjà",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de l’actif financier",
      error: error.message,
    })
  }
}

// Modifier un actif financier
export const putActifFinancier = async (
  request,
  response
) => {
  try {
    const actifIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(actifIdNombre) ||
      actifIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’actif financier doit être un nombre entier supérieur à 0",
      })
    }

    const {
      symbole,
      nom,
      type_actif,
      devise,
    } = request.body

    if (
      symbole === undefined ||
      nom === undefined ||
      type_actif === undefined ||
      devise === undefined
    ) {
      return response.status(400).json({
        message:
          "symbole, nom, type_actif et devise sont obligatoires",
      })
    }

    if (!texteEstValide(symbole)) {
      return response.status(400).json({
        message:
          "symbole doit être un texte non vide",
      })
    }

    if (!texteEstValide(nom)) {
      return response.status(400).json({
        message:
          "nom doit être un texte non vide",
      })
    }

    if (
      !typesActifsAutorises.includes(
        type_actif
      )
    ) {
      return response.status(400).json({
        message:
          "type_actif doit être action, etf, crypto, obligation, fonds, immobilier ou autre",
      })
    }

    if (!texteEstValide(devise)) {
      return response.status(400).json({
        message:
          "devise doit être un texte non vide",
      })
    }

    const actifModifie =
      await updateActifFinancier(
        actifIdNombre,
        {
          symbole: symbole
            .trim()
            .toUpperCase(),
          nom: nom.trim(),
          type_actif,
          devise: devise
            .trim()
            .toUpperCase(),
        }
      )

    if (!actifModifie) {
      return response.status(404).json({
        message:
          "Actif financier introuvable",
      })
    }

    response.json(actifModifie)
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        message:
          "Cet actif financier existe déjà",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de l’actif financier",
      error: error.message,
    })
  }
}

// Supprimer un actif financier
export const deleteActifFinancierById = async (
  request,
  response
) => {
  try {
    const actifIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(actifIdNombre) ||
      actifIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’actif financier doit être un nombre entier supérieur à 0",
      })
    }

    const actifSupprime =
      await deleteActifFinancier(
        actifIdNombre
      )

    if (!actifSupprime) {
      return response.status(404).json({
        message:
          "Actif financier introuvable",
      })
    }

    response.json({
      message:
        "Actif financier supprimé",
      actif: actifSupprime,
    })
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Cet actif financier est utilisé par une opération d’investissement",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la suppression de l’actif financier",
      error: error.message,
    })
  }
}