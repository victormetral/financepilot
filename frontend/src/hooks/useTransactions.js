// ============================================================
// HOOK DES TRANSACTIONS
// ============================================================
//
// Depuis Lot 5 : plus de vérification de token en local, le
// cookie httpOnly gère l'authentification.
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
      if (!utilisateur) {
        setTransactions([])
        return
      }

      try {
        const resultat = await recupererTransactions()

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
    try {
      const resultat = await creerTransaction(donneesFormulaire)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      const resultatListe = await recupererTransactions()

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
    try {
      const resultat = await modifierTransaction(transactionId, donneesFormulaire)

      if (!resultat.ok) {
        setMessage(resultat.donnees.message)
        return false
      }

      const resultatListe = await recupererTransactions()

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
    try {
      const resultat = await supprimerTransaction(transactionId)

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