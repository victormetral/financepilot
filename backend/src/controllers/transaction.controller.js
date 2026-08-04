/*
  CONTRÔLEUR DES TRANSACTIONS

  Ce fichier orchestre les requêtes HTTP liées
  aux transactions.

  Routes concernées :
  - GET    /api/transactions
  - GET    /api/transactions/:id
  - POST   /api/transactions
  - PUT    /api/transactions/:id
  - DELETE /api/transactions/:id

  Répartition des responsabilités :

  transaction.controller.js
  → récupère les données HTTP
  → récupère l’utilisateur depuis le JWT

  transaction.validator.js
  → valide et transforme les données

  transaction.service.js
  → exécute les requêtes SQL
  → vérifie que les ressources appartiennent
    à l’utilisateur authentifié

  Règle de sécurité :
  utilisateurId vient toujours du JWT.
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
  Récupère uniquement les transactions appartenant
  à l’utilisateur authentifié.

  Exemple :
  GET /api/transactions?compte_id=1&limite=3&page=2
*/
export const getTransactions = async (
  request,
  response
) => {
  try {
    const validation =
      validerFiltresTransactions(
        request.query
      )

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

    // 🟨 NOUVEAU : identité extraite du JWT.
    const utilisateurId =
      request.utilisateur.utilisateurId

    /*
      🟨 CORRIGÉ

      utilisateurId devient le premier argument
      envoyé au service.
    */
    const resultat =
      await findAllTransactions(
        utilisateurId,
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
      transactions:
        resultat.transactions,

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
  Récupère une transaction uniquement si son compte
  appartient à l’utilisateur authentifié.
*/
export const getTransactionById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdTransaction(
        request.params.id
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ : vérification du propriétaire.
    const transaction =
      await findTransactionById(
        validation.donnees.id,
        utilisateurId
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
  Crée une transaction uniquement avec :

  - un compte appartenant à l’utilisateur ;
  - une catégorie lui appartenant également
    ou aucune catégorie.
*/
export const postTransaction = async (
  request,
  response
) => {
  try {
    const validation =
      validerDonneesTransaction(
        request.body
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ
    const nouvelleTransaction =
      await createTransaction(
        utilisateurId,
        validation.donnees
      )

    /*
      🟨 NOUVEAU

      Le service ne crée rien si le compte ou la catégorie
      n’appartient pas à l’utilisateur authentifié.
    */
    if (!nouvelleTransaction) {
      return response.status(404).json({
        message:
          "Compte ou catégorie introuvable",
      })
    }

    response
      .status(201)
      .json(nouvelleTransaction)
  } catch (error) {
    /*
      Cette erreur peut encore apparaître si une ressource
      est supprimée entre la vérification et l’insertion.
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
  Modifie une transaction uniquement si :

  - la transaction appartient à l’utilisateur ;
  - le nouveau compte lui appartient ;
  - la nouvelle catégorie lui appartient
    ou vaut null.
*/
export const putTransaction = async (
  request,
  response
) => {
  try {
    const validationId =
      validerIdTransaction(
        request.params.id
      )

    if (!validationId.estValide) {
      return response.status(400).json({
        message: validationId.message,
      })
    }

    const validationDonnees =
      validerDonneesTransaction(
        request.body
      )

    if (!validationDonnees.estValide) {
      return response.status(400).json({
        message:
          validationDonnees.message,
      })
    }

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    /*
      🟨 CORRIGÉ

      Le service reçoit :
      1. l’identifiant de la transaction ;
      2. l’identifiant de l’utilisateur du JWT ;
      3. les nouvelles données.
    */
    const transactionModifiee =
      await updateTransaction(
        validationId.donnees.id,
        utilisateurId,
        validationDonnees.donnees
      )

    if (!transactionModifiee) {
      return response.status(404).json({
        message:
          "Transaction, compte ou catégorie introuvable",
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
  Supprime une transaction uniquement si son compte
  appartient à l’utilisateur authentifié.
*/
export const deleteTransactionById = async (
  request,
  response
) => {
  try {
    const validation =
      validerIdTransaction(
        request.params.id
      )

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    // 🟨 NOUVEAU
    const utilisateurId =
      request.utilisateur.utilisateurId

    // 🟨 CORRIGÉ : vérification du propriétaire.
    const transactionSupprimee =
      await deleteTransaction(
        validation.donnees.id,
        utilisateurId
      )

    if (!transactionSupprimee) {
      return response.status(404).json({
        message: "Transaction introuvable",
      })
    }

    response.json({
      message: "Transaction supprimée",
      transaction:
        transactionSupprimee,
    })
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la suppression de la transaction",
      error: error.message,
    })
  }
}