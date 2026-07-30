import {
  findAllTransactions,
  findTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transaction.service.js"

export const getTransactions = async (request, response) => {
  try {
    const {
      compte_id,
      categorie_id,
      type_transaction,
      date_debut,
      date_fin,
      recherche,
      limite,
      page,
    } = request.query

    const compteIdNombre =
      compte_id !== undefined
        ? Number(compte_id)
        : undefined

    const categorieIdNombre =
      categorie_id !== undefined
        ? Number(categorie_id)
        : undefined

    const limiteNombre =
      limite !== undefined
        ? Number(limite)
        : 20

    const pageNombre =
      page !== undefined
        ? Number(page)
        : 1

    const typesAutorises = [
      "revenu",
      "depense",
      "transfert",
    ]

    const formatDate = /^\d{4}-\d{2}-\d{2}$/

    const dateEstValide = (date) => {
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

    if (
      compteIdNombre !== undefined &&
      (
        !Number.isInteger(compteIdNombre) ||
        compteIdNombre <= 0
      )
    ) {
      return response.status(400).json({
        message:
          "compte_id doit être un nombre entier supérieur à 0",
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
      type_transaction !== undefined &&
      !typesAutorises.includes(type_transaction)
    ) {
      return response.status(400).json({
        message:
          "type_transaction doit être revenu, depense ou transfert",
      })
    }

    if (
      date_debut !== undefined &&
      !dateEstValide(date_debut)
    ) {
      return response.status(400).json({
        message:
          "date_debut doit être une date valide au format AAAA-MM-JJ",
      })
    }

    if (
      date_fin !== undefined &&
      !dateEstValide(date_fin)
    ) {
      return response.status(400).json({
        message:
          "date_fin doit être une date valide au format AAAA-MM-JJ",
      })
    }

    if (
      date_debut !== undefined &&
      date_fin !== undefined &&
      date_debut > date_fin
    ) {
      return response.status(400).json({
        message:
          "date_debut doit être antérieure ou égale à date_fin",
      })
    }

    if (
      !Number.isInteger(limiteNombre) ||
      limiteNombre <= 0 ||
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

    const resultat = await findAllTransactions(
      compteIdNombre,
      categorieIdNombre,
      type_transaction,
      date_debut,
      date_fin,
      recherche,
      limiteNombre,
      offsetNombre
    )

    const totalPages =
      Math.ceil(resultat.total / limiteNombre)

    const pagePrecedente =
      pageNombre > 1

    const pageSuivante =
      pageNombre < totalPages

    response.json({
      transactions: resultat.transactions,
      pagination: {
        total: resultat.total,
        limite: limiteNombre,
        offset: offsetNombre,
        page: pageNombre,
        total_pages: totalPages,
        has_previous: pagePrecedente,
        has_next: pageSuivante,
      },
    })
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des transactions",
      error: error.message,
    })
  }
}

export const getTransactionById = async (
  request,
  response
) => {
  try {
    const transaction = await findTransactionById(
      request.params.id
    )

    if (!transaction) {
      return response.status(404).json({
        message: "Transaction introuvable",
      })
    }

    response.json(transaction)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de la transaction",
      error: error.message,
    })
  }
}

export const postTransaction = async (
  request,
  response
) => {
  try {
    const {
      compte_id,
      categorie_id,
      libelle,
      montant,
      date_transaction,
      type_transaction,
    } = request.body

    if (
      !compte_id ||
      !libelle ||
      montant === undefined ||
      !date_transaction ||
      !type_transaction
    ) {
      return response.status(400).json({
        message:
          "compte_id, libelle, montant, date_transaction et type_transaction sont obligatoires",
      })
    }

    if (
      type_transaction !== "revenu" &&
      type_transaction !== "depense" &&
      type_transaction !== "transfert"
    ) {
      return response.status(400).json({
        message:
          "type_transaction doit être revenu, depense ou transfert",
      })
    }

    const nouvelleTransaction =
      await createTransaction({
        compte_id,
        categorie_id,
        libelle,
        montant,
        date_transaction,
        type_transaction,
      })

    response.status(201).json(nouvelleTransaction)
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Le compte ou la catégorie indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de la transaction",
      error: error.message,
    })
  }
}

export const putTransaction = async (
  request,
  response
) => {
  try {
    const {
      compte_id,
      categorie_id,
      libelle,
      montant,
      date_transaction,
      type_transaction,
    } = request.body

    if (
      !compte_id ||
      !libelle ||
      montant === undefined ||
      !date_transaction ||
      !type_transaction
    ) {
      return response.status(400).json({
        message:
          "compte_id, libelle, montant, date_transaction et type_transaction sont obligatoires",
      })
    }

    if (
      type_transaction !== "revenu" &&
      type_transaction !== "depense" &&
      type_transaction !== "transfert"
    ) {
      return response.status(400).json({
        message:
          "type_transaction doit être revenu, depense ou transfert",
      })
    }

    const transactionModifiee =
      await updateTransaction(
        request.params.id,
        {
          compte_id,
          categorie_id,
          libelle,
          montant,
          date_transaction,
          type_transaction,
        }
      )

    if (!transactionModifiee) {
      return response.status(404).json({
        message: "Transaction introuvable",
      })
    }

    response.json(transactionModifiee)
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Le compte ou la catégorie indiqué n’existe pas",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de la transaction",
      error: error.message,
    })
  }
}

export const deleteTransactionById = async (
  request,
  response
) => {
  try {
    const transactionSupprimee =
      await deleteTransaction(request.params.id)

    if (!transactionSupprimee) {
      return response.status(404).json({
        message: "Transaction introuvable",
      })
    }

    response.json({
      message: "Transaction supprimée",
      transaction: transactionSupprimee,
    })
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la suppression de la transaction",
      error: error.message,
    })
  }
}