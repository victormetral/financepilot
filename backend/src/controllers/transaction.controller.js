/*
  CONTRÔLEUR DES TRANSACTIONS

  transaction.controller.js → orchestre les requêtes HTTP
  transaction.validator.js / transactionFiltres.validator.js → validation
  transaction.service.js / transactionListe.service.js → SQL

  Règle : utilisateurId vient toujours du JWT.
*/

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"
import { estErreurCleEtrangere } from "../utils/postgres.utils.js"

import {
  findTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transaction.service.js"

import { findAllTransactions } from "../services/transactionListe.service.js"
import { validerFiltresTransactions } from "../validators/transactionFiltres.validator.js"

import {
  validerIdTransaction,
  validerDonneesTransaction,
} from "../validators/transaction.validator.js"

import {
  creerPagination,
  pageExiste,
  calculerTotalPages,
} from "../utils/pagination.utils.js"

export const getTransactions = asyncHandler(async (request, response) => {
  const validation = validerFiltresTransactions(request.query)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const { compteId, categorieId, typeTransaction, dateDebut, dateFin, recherche, limite, page, offset } =
    validation.donnees

  const utilisateurId = request.utilisateur.utilisateurId

  const resultat = await findAllTransactions(
    utilisateurId, compteId, categorieId, typeTransaction, dateDebut, dateFin, recherche, limite, offset
  )

  if (!pageExiste({ total: resultat.total, page, limite })) {
    const totalPages = calculerTotalPages(resultat.total, limite)
    throw new ErreurHTTP(400, `La page ${page} n'existe pas. Dernière page disponible : ${totalPages}`)
  }

  response.json({
    transactions: resultat.transactions,
    pagination: creerPagination({ total: resultat.total, limite, page }),
  })
})

export const getTransactionById = asyncHandler(async (request, response) => {
  const validation = validerIdTransaction(request.params.id)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const utilisateurId = request.utilisateur.utilisateurId
  const transaction = await findTransactionById(validation.donnees.id, utilisateurId)

  if (!transaction) {
    throw new ErreurHTTP(404, "Transaction introuvable")
  }

  response.json(transaction)
})

export const postTransaction = asyncHandler(async (request, response) => {
  const validation = validerDonneesTransaction(request.body)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const utilisateurId = request.utilisateur.utilisateurId

  try {
    const nouvelleTransaction = await createTransaction(utilisateurId, validation.donnees)

    if (!nouvelleTransaction) {
      throw new ErreurHTTP(404, "Compte ou catégorie introuvable")
    }

    response.status(201).json(nouvelleTransaction)
  } catch (error) {
    if (error instanceof ErreurHTTP) throw error
    if (estErreurCleEtrangere(error)) {
      throw new ErreurHTTP(409, "Le compte ou la catégorie indiqué n'existe pas")
    }
    throw error
  }
})

export const putTransaction = asyncHandler(async (request, response) => {
  const validationId = validerIdTransaction(request.params.id)

  if (!validationId.estValide) {
    throw new ErreurHTTP(400, validationId.message)
  }

  const validationDonnees = validerDonneesTransaction(request.body)

  if (!validationDonnees.estValide) {
    throw new ErreurHTTP(400, validationDonnees.message)
  }

  const utilisateurId = request.utilisateur.utilisateurId

  try {
    const transactionModifiee = await updateTransaction(
      validationId.donnees.id, utilisateurId, validationDonnees.donnees
    )

    if (!transactionModifiee) {
      throw new ErreurHTTP(404, "Transaction, compte ou catégorie introuvable")
    }

    response.json(transactionModifiee)
  } catch (error) {
    if (error instanceof ErreurHTTP) throw error
    if (estErreurCleEtrangere(error)) {
      throw new ErreurHTTP(409, "Le compte ou la catégorie indiqué n'existe pas")
    }
    throw error
  }
})

export const deleteTransactionById = asyncHandler(async (request, response) => {
  const validation = validerIdTransaction(request.params.id)

  if (!validation.estValide) {
    throw new ErreurHTTP(400, validation.message)
  }

  const utilisateurId = request.utilisateur.utilisateurId
  const transactionSupprimee = await deleteTransaction(validation.donnees.id, utilisateurId)

  if (!transactionSupprimee) {
    throw new ErreurHTTP(404, "Transaction introuvable")
  }

  response.json({ message: "Transaction supprimée", transaction: transactionSupprimee })
})