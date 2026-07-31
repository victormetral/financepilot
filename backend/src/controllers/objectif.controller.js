import {
  findAllObjectifs,
  findObjectifById,
  createObjectif,
  updateObjectif,
  deleteObjectif,
} from "../services/objectif.service.js"

// Valeurs autorisées pour le statut
const statutsAutorises = [
  "en cours",
  "atteint",
  "abandonne",
]

// Vérifier qu’une date existe réellement
const dateEstValide = (date) => {
  const formatDate = /^\d{4}-\d{2}-\d{2}$/

  if (!formatDate.test(date)) {
    return false
  }

  const [annee, mois, jour] = date
    .split("-")
    .map(Number)

  const dateConstruite = new Date(
    Date.UTC(annee, mois - 1, jour)
  )

  return (
    dateConstruite.getUTCFullYear() === annee &&
    dateConstruite.getUTCMonth() === mois - 1 &&
    dateConstruite.getUTCDate() === jour
  )
}

// Récupérer tous les objectifs
export const getObjectifs = async (
  request,
  response
) => {
  try {
    const objectifs = await findAllObjectifs()

    response.json(objectifs)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des objectifs",
      error: error.message,
    })
  }
}

// Récupérer un objectif par son identifiant
export const getObjectifById = async (
  request,
  response
) => {
  try {
    const objectifIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(objectifIdNombre) ||
      objectifIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’objectif doit être un nombre entier supérieur à 0",
      })
    }

    const objectif = await findObjectifById(
      objectifIdNombre
    )

    if (!objectif) {
      return response.status(404).json({
        message: "Objectif introuvable",
      })
    }

    response.json(objectif)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de l’objectif",
      error: error.message,
    })
  }
}

// Créer un objectif
export const postObjectif = async (
  request,
  response
) => {
  try {
    const {
      utilisateur_id,
      nom,
      montant_cible,
      montant_actuel = 0,
      date_echeance = null,
      statut = "en cours",
    } = request.body

    if (
      utilisateur_id === undefined ||
      !nom ||
      montant_cible === undefined
    ) {
      return response.status(400).json({
        message:
          "utilisateur_id, nom et montant_cible sont obligatoires",
      })
    }

    const utilisateurIdNombre =
      Number(utilisateur_id)

    const montantCibleNombre =
      Number(montant_cible)

    const montantActuelNombre =
      Number(montant_actuel)

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
      typeof nom !== "string" ||
      nom.trim().length === 0
    ) {
      return response.status(400).json({
        message:
          "nom doit être un texte non vide",
      })
    }

    if (
      !Number.isFinite(montantCibleNombre) ||
      montantCibleNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "montant_cible doit être un nombre supérieur à 0",
      })
    }

    if (
      !Number.isFinite(montantActuelNombre) ||
      montantActuelNombre < 0
    ) {
      return response.status(400).json({
        message:
          "montant_actuel doit être un nombre supérieur ou égal à 0",
      })
    }

    if (
      date_echeance !== null &&
      !dateEstValide(date_echeance)
    ) {
      return response.status(400).json({
        message:
          "date_echeance doit être une date valide au format AAAA-MM-JJ",
      })
    }

    if (!statutsAutorises.includes(statut)) {
      return response.status(400).json({
        message:
          "statut doit être en cours, atteint ou abandonne",
      })
    }

    const nouvelObjectif = await createObjectif({
      utilisateur_id: utilisateurIdNombre,
      nom: nom.trim(),
      montant_cible: montantCibleNombre,
      montant_actuel: montantActuelNombre,
      date_echeance,
      statut,
    })

    response.status(201).json(nouvelObjectif)
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "L’utilisateur indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de l’objectif",
      error: error.message,
    })
  }
}

// Modifier un objectif
export const putObjectif = async (
  request,
  response
) => {
  try {
    const objectifIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(objectifIdNombre) ||
      objectifIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’objectif doit être un nombre entier supérieur à 0",
      })
    }

    const {
      utilisateur_id,
      nom,
      montant_cible,
      montant_actuel,
      date_echeance,
      statut,
    } = request.body

    if (
      utilisateur_id === undefined ||
      !nom ||
      montant_cible === undefined ||
      montant_actuel === undefined ||
      statut === undefined
    ) {
      return response.status(400).json({
        message:
          "utilisateur_id, nom, montant_cible, montant_actuel et statut sont obligatoires",
      })
    }

    const utilisateurIdNombre =
      Number(utilisateur_id)

    const montantCibleNombre =
      Number(montant_cible)

    const montantActuelNombre =
      Number(montant_actuel)

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
      typeof nom !== "string" ||
      nom.trim().length === 0
    ) {
      return response.status(400).json({
        message:
          "nom doit être un texte non vide",
      })
    }

    if (
      !Number.isFinite(montantCibleNombre) ||
      montantCibleNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "montant_cible doit être un nombre supérieur à 0",
      })
    }

    if (
      !Number.isFinite(montantActuelNombre) ||
      montantActuelNombre < 0
    ) {
      return response.status(400).json({
        message:
          "montant_actuel doit être un nombre supérieur ou égal à 0",
      })
    }

    if (
      date_echeance !== null &&
      date_echeance !== undefined &&
      !dateEstValide(date_echeance)
    ) {
      return response.status(400).json({
        message:
          "date_echeance doit être une date valide au format AAAA-MM-JJ",
      })
    }

    if (!statutsAutorises.includes(statut)) {
      return response.status(400).json({
        message:
          "statut doit être en cours, atteint ou abandonne",
      })
    }

    const objectifModifie =
      await updateObjectif(
        objectifIdNombre,
        {
          utilisateur_id: utilisateurIdNombre,
          nom: nom.trim(),
          montant_cible: montantCibleNombre,
          montant_actuel: montantActuelNombre,
          date_echeance: date_echeance ?? null,
          statut,
        }
      )

    if (!objectifModifie) {
      return response.status(404).json({
        message: "Objectif introuvable",
      })
    }

    response.json(objectifModifie)
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "L’utilisateur indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de l’objectif",
      error: error.message,
    })
  }
}

// Supprimer un objectif
export const deleteObjectifById = async (
  request,
  response
) => {
  try {
    const objectifIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(objectifIdNombre) ||
      objectifIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’objectif doit être un nombre entier supérieur à 0",
      })
    }

    const objectifSupprime =
      await deleteObjectif(objectifIdNombre)

    if (!objectifSupprime) {
      return response.status(404).json({
        message: "Objectif introuvable",
      })
    }

    response.json({
      message: "Objectif supprimé",
      objectif: objectifSupprime,
    })
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la suppression de l’objectif",
      error: error.message,
    })
  }
}