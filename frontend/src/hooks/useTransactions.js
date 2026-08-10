// ============================================================
// HOOK DES TRANSACTIONS
// ============================================================
//
// Rôle : charger, créer, modifier et supprimer les transactions
// de l'utilisateur connecté. Même pattern que useBudgets.js
// (rechargement complet après création/modification, pour
// récupérer nom_compte/nom_categorie via jointure backend).
//
// Utilisé par : App.jsx

import { useEffect, useState } from "react"

import {
  creerTransaction,
  modifierTransaction,
  recupererTransactions,
  supprimerTransaction,
} from "../services/transaction.service.js"

export function useTransactions(utilisateur, setMessage) {
  const [transactions, setTransactions] = useState([])
  const [transactionEnModification, setTransactionEnModification] = useState(null)

  useEffect(() => {
    async function chargerTransactions() {
      const token = localStorage.getItem("token")

      if (!utilisateur || !token) {
        setTransactions([])
        return
      }

      try {
        const resultat = await recupererTransactions(token)

        if (resultat.ok) {
          setTransactions(resultat.donnees.transactions)
        } else {
          setTransactions([])
          setMessage(resultat.donnees.message)
        }
      } catch {
        setTransactions([])
        setMessage("Impossible de récupérer les transactions.")
      }
    }

    chargerTransactions()
  }, [utilisateur, setMessage])

  async function gererCreationTransaction(donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await creerTransaction(donneesFormulaire, token)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      const resultatListe = await recupererTransactions(token)

      if (resultatListe.ok) {
        setTransactions(resultatListe.donnees.transactions)
      }

      setMessage("Transaction créée.")

      return true
    } catch {
      setMessage("Impossible de créer la transaction.")

      return false
    }
  }

  async function gererModificationTransaction(transactionId, donneesFormulaire) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return false
    }

    try {
      const resultat = await modifierTransaction(
        transactionId,
        donneesFormulaire,
        token
      )

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      const resultatListe = await recupererTransactions(token)

      if (resultatListe.ok) {
        setTransactions(resultatListe.donnees.transactions)
      }

      setTransactionEnModification(null)
      setMessage("Transaction modifiée avec succès.")

      return true
    } catch {
      setMessage("Impossible de modifier la transaction.")

      return false
    }
  }

  async function gererSuppressionTransaction(transactionId) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    try {
      const resultat = await supprimerTransaction(transactionId, token)

      if (resultat.ok) {
        setTransactions((transactionsActuelles) =>
          transactionsActuelles.filter(
            (transaction) => transaction.id !== transactionId
          )
        )

        setMessage(resultat.donnees.message)
      } else {
        setMessage(resultat.donnees.message)
      }
    } catch {
      setMessage("Impossible de supprimer la transaction.")
    }
  }

  return {
    transactions,
    transactionEnModification,
    setTransactionEnModification,
    gererCreationTransaction,
    gererModificationTransaction,
    gererSuppressionTransaction,
  }
}