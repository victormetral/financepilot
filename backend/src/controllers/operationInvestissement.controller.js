import {
  findAllOperationsInvestissement,
  findOperationInvestissementById,
  createOperationInvestissement,
  updateOperationInvestissement,
  deleteOperationInvestissement,
} from "../services/operationInvestissement.service.js"

// Vérifier qu’un texte n’est pas vide
const texteEstValide = (texte) => {
  return (
    typeof texte === "string" &&
    texte.trim().length > 0
  )
}

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

// Récupérer toutes les opérations
export const getOperationsInvestissement = async (
  request,
  response
) => {
  try {
    const operations =
      await findAllOperationsInvestissement()

    response.json(operations)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des opérations d’investissement",
      error: error.message,
    })
  }
}

// Récupérer une opération par son identifiant
export const getOperationInvestissementById = async (
  request,
  response
) => {
  try {
    const operationIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(operationIdNombre) ||
      operationIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’opération doit être un nombre entier supérieur à 0",
      })
    }

    const operation =
      await findOperationInvestissementById(
        operationIdNombre
      )

    if (!operation) {
      return response.status(404).json({
        message:
          "Opération d’investissement introuvable",
      })
    }

    response.json(operation)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de l’opération d’investissement",
      error: error.message,
    })
  }
}

// Créer une opération
export const postOperationInvestissement = async (
  request,
  response
) => {
  try {
    const {
      compte_id,
      actif_financier_id,
      type_operation,
      quantite,
      prix_unitaire,
      frais = 0,
      date_operation,
    } = request.body

    if (
      compte_id === undefined ||
      actif_financier_id === undefined ||
      type_operation === undefined ||
      quantite === undefined ||
      prix_unitaire === undefined ||
      date_operation === undefined
    ) {
      return response.status(400).json({
        message:
          "compte_id, actif_financier_id, type_operation, quantite, prix_unitaire et date_operation sont obligatoires",
      })
    }

    const compteIdNombre = Number(compte_id)

    const actifFinancierIdNombre =
      Number(actif_financier_id)

    const quantiteNombre = Number(quantite)

    const prixUnitaireNombre =
      Number(prix_unitaire)

    const fraisNombre = Number(frais)

    if (
      !Number.isInteger(compteIdNombre) ||
      compteIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "compte_id doit être un nombre entier supérieur à 0",
      })
    }

    if (
      !Number.isInteger(actifFinancierIdNombre) ||
      actifFinancierIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "actif_financier_id doit être un nombre entier supérieur à 0",
      })
    }

    if (!texteEstValide(type_operation)) {
      return response.status(400).json({
        message:
          "type_operation doit être un texte non vide",
      })
    }

    if (
      !Number.isFinite(quantiteNombre) ||
      quantiteNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "quantite doit être un nombre supérieur à 0",
      })
    }

    if (
      !Number.isFinite(prixUnitaireNombre) ||
      prixUnitaireNombre < 0
    ) {
      return response.status(400).json({
        message:
          "prix_unitaire doit être un nombre supérieur ou égal à 0",
      })
    }

    if (
      !Number.isFinite(fraisNombre) ||
      fraisNombre < 0
    ) {
      return response.status(400).json({
        message:
          "frais doit être un nombre supérieur ou égal à 0",
      })
    }

    if (!dateEstValide(date_operation)) {
      return response.status(400).json({
        message:
          "date_operation doit être une date valide au format AAAA-MM-JJ",
      })
    }

    const nouvelleOperation =
      await createOperationInvestissement({
        compte_id: compteIdNombre,
        actif_financier_id:
          actifFinancierIdNombre,
        type_operation:
          type_operation.trim().toLowerCase(),
        quantite: quantiteNombre,
        prix_unitaire: prixUnitaireNombre,
        frais: fraisNombre,
        date_operation,
      })

    response.status(201).json(nouvelleOperation)
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Le compte ou l’actif financier indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de l’opération d’investissement",
      error: error.message,
    })
  }
}

// Modifier une opération
export const putOperationInvestissement = async (
  request,
  response
) => {
  try {
    const operationIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(operationIdNombre) ||
      operationIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’opération doit être un nombre entier supérieur à 0",
      })
    }

    const {
      compte_id,
      actif_financier_id,
      type_operation,
      quantite,
      prix_unitaire,
      frais,
      date_operation,
    } = request.body

    if (
      compte_id === undefined ||
      actif_financier_id === undefined ||
      type_operation === undefined ||
      quantite === undefined ||
      prix_unitaire === undefined ||
      frais === undefined ||
      date_operation === undefined
    ) {
      return response.status(400).json({
        message:
          "compte_id, actif_financier_id, type_operation, quantite, prix_unitaire, frais et date_operation sont obligatoires",
      })
    }

    const compteIdNombre = Number(compte_id)

    const actifFinancierIdNombre =
      Number(actif_financier_id)

    const quantiteNombre = Number(quantite)

    const prixUnitaireNombre =
      Number(prix_unitaire)

    const fraisNombre = Number(frais)

    if (
      !Number.isInteger(compteIdNombre) ||
      compteIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "compte_id doit être un nombre entier supérieur à 0",
      })
    }

    if (
      !Number.isInteger(actifFinancierIdNombre) ||
      actifFinancierIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "actif_financier_id doit être un nombre entier supérieur à 0",
      })
    }

    if (!texteEstValide(type_operation)) {
      return response.status(400).json({
        message:
          "type_operation doit être un texte non vide",
      })
    }

    if (
      !Number.isFinite(quantiteNombre) ||
      quantiteNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "quantite doit être un nombre supérieur à 0",
      })
    }

    if (
      !Number.isFinite(prixUnitaireNombre) ||
      prixUnitaireNombre < 0
    ) {
      return response.status(400).json({
        message:
          "prix_unitaire doit être un nombre supérieur ou égal à 0",
      })
    }

    if (
      !Number.isFinite(fraisNombre) ||
      fraisNombre < 0
    ) {
      return response.status(400).json({
        message:
          "frais doit être un nombre supérieur ou égal à 0",
      })
    }

    if (!dateEstValide(date_operation)) {
      return response.status(400).json({
        message:
          "date_operation doit être une date valide au format AAAA-MM-JJ",
      })
    }

    const operationModifiee =
      await updateOperationInvestissement(
        operationIdNombre,
        {
          compte_id: compteIdNombre,
          actif_financier_id:
            actifFinancierIdNombre,
          type_operation:
            type_operation.trim().toLowerCase(),
          quantite: quantiteNombre,
          prix_unitaire: prixUnitaireNombre,
          frais: fraisNombre,
          date_operation,
        }
      )

    if (!operationModifiee) {
      return response.status(404).json({
        message:
          "Opération d’investissement introuvable",
      })
    }

    response.json(operationModifiee)
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Le compte ou l’actif financier indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de l’opération d’investissement",
      error: error.message,
    })
  }
}

// Supprimer une opération
export const deleteOperationInvestissementById =
  async (request, response) => {
    try {
      const operationIdNombre = Number(
        request.params.id
      )

      if (
        !Number.isInteger(operationIdNombre) ||
        operationIdNombre <= 0
      ) {
        return response.status(400).json({
          message:
            "L’identifiant de l’opération doit être un nombre entier supérieur à 0",
        })
      }

      const operationSupprimee =
        await deleteOperationInvestissement(
          operationIdNombre
        )

      if (!operationSupprimee) {
        return response.status(404).json({
          message:
            "Opération d’investissement introuvable",
        })
      }

      response.json({
        message:
          "Opération d’investissement supprimée",
        operation: operationSupprimee,
      })
    } catch (error) {
      response.status(500).json({
        message:
          "Erreur lors de la suppression de l’opération d’investissement",
        error: error.message,
      })
    }
  }