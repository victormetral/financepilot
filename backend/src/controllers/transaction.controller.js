/*
  CONTRÔLEUR DES TRANSACTIONS

  Ce fichier orchestre les requêtes HTTP liées aux transactions.

  Il doit rester simple :
  - récupérer request ;
  - appeler transaction.validator.js ;
  - appeler transaction.service.js ;
  - renvoyer response.

  Répartition des responsabilités :

  transaction.controller.js
  → orchestre la requête HTTP

  transaction.validator.js
  → valide et transforme les données

  transaction.service.js
  → exécute les requêtes SQL

  Victor :
  si une règle de validation change, regarde d’abord dans
  transaction.validator.js, pas dans ce contrôleur.
*/

import {
  estErreurCleEtrangere,
} from "../utils/postgres.utils.js"

import {
  findAllTransactions,
  findTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transaction.service.js"

import {
  validerFiltresTransactions,
  validerIdTransaction,
  validerDonneesTransaction,
} from "../validators/transaction.validator.js"

import {
  creerPagination,
  pageExiste,
  calculerTotalPages,
} from "../utils/pagination.utils.js"

/*
  Récupère les transactions avec les filtres et la pagination.

  Exemple :
  GET /api/transactions?compte_id=1&limite=3&page=2
*/
export const getTransactions = async (
  request,
  response
) => {
  try {
    // Le validateur transforme et vérifie request.query.
    const validation =
      validerFiltresTransactions(request.query)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const {
      compteId,
      categorieId,
      typeTransaction,
      dateDebut,
      dateFin,
      recherche,
      limite,
      page,
      offset,
    } = validation.donnees

    const resultat = await findAllTransactions(
      compteId,
      categorieId,
      typeTransaction,
      dateDebut,
      dateFin,
      recherche,
      limite,
      offset
    )

    /*
      Une page supérieure au nombre total de pages
      est refusée lorsque des résultats existent.
    */
    if (
      !pageExiste({
        total: resultat.total,
        page,
        limite,
      })
    ) {
      const totalPages =
        calculerTotalPages(
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
      transactions: resultat.transactions,

      // Construit toutes les informations de navigation.
      pagination: creerPagination({
        total: resultat.total,
        limite,
        page,
      }),
    })
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des transactions",
      error: error.message,
    })
  }
}

/*
  Récupère une transaction grâce à son identifiant.

  Exemple :
  GET /api/transactions/3
*/
export const getTransactionById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdTransaction(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const transaction =
      await findTransactionById(
        validation.donnees.id
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

/*
  Crée une transaction.

  Le validateur vérifie notamment :
  - le compte ;
  - la catégorie facultative ;
  - le libellé ;
  - le montant ;
  - la date ;
  - le type de transaction.
*/
export const postTransaction = async (
  request,
  response
) => {
  try {
    const validation =
      validerDonneesTransaction(request.body)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const nouvelleTransaction =
      await createTransaction(
        validation.donnees
      )

    response.status(201).json(
      nouvelleTransaction
    )
  } catch (error) {
    /*
      PostgreSQL 23503 :
      le compte ou la catégorie référencée n’existe pas.
    */
    if (estErreurCleEtrangere(error)) {
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

/*
  Modifie entièrement une transaction.

  PUT utilise les mêmes règles de validation que POST.
*/
export const putTransaction = async (
  request,
  response
) => {
  try {
    const validationId =
      validerIdTransaction(request.params.id)

    if (!validationId.estValide) {
      return response.status(400).json({
        message: validationId.message,
      })
    }

    const validationDonnees =
      validerDonneesTransaction(request.body)

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message: validationDonnees.message,
      })
    }

    const transactionModifiee =
      await updateTransaction(
        validationId.donnees.id,
        validationDonnees.donnees
      )

    if (!transactionModifiee) {
      return response.status(404).json({
        message: "Transaction introuvable",
      })
    }

    response.json(transactionModifiee)
  } catch (error) {
    if (estErreurCleEtrangere(error)) {
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

/*
  Supprime une transaction grâce à son identifiant.

  Le service renvoie la ligne supprimée grâce à
  RETURNING *.
*/
export const deleteTransactionById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdTransaction(request.params.id)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const transactionSupprimee =
      await deleteTransaction(
        validation.donnees.id
      )

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