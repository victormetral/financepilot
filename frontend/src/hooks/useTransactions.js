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

  // ==========================================================
  // 1. CHARGEMENT INITIAL
  // ==========================================================

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

  // ==========================================================
  // 2. CRÉATION
  // ==========================================================

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

  // ==========================================================
  // 3. DUPLICATION
  // ==========================================================

  /*
    Recrée une transaction existante à la date du jour.

    C'est le geste des dépenses qui reviennent — le plein
    d'essence, la boulangerie — sans avoir à ressaisir le
    montant ni le libellé.

    La date n'est volontairement pas reprise : dupliquer une
    dépense du mois dernier à sa date d'origine créerait un
    doublon dans le passé, jamais ce que l'on veut.

    La fonction réutilise gererCreationTransaction : le
    rechargement de la liste et la gestion d'erreur sont donc
    identiques à ceux d'une création normale.
  */
  async function gererDuplicationTransaction(transactionId) {
    const transaction = transactions.find(
      (transactionActuelle) => transactionActuelle.id === transactionId
    )

    if (!transaction) {
      setMessage("Transaction introuvable.")
      return false
    }

    const maintenant = new Date()

    const dateDuJour = [
      maintenant.getFullYear(),
      String(maintenant.getMonth() + 1).padStart(2, "0"),
      String(maintenant.getDate()).padStart(2, "0"),
    ].join("-")

    return gererCreationTransaction({
      compteId: transaction.compte_id,
      categorieId: transaction.categorie_id,
      libelle: transaction.libelle,
      montant: transaction.montant,
      dateTransaction: dateDuJour,
      typeTransaction: transaction.type_transaction,
    })
  }

  // ==========================================================
  // 4. MODIFICATION
  // ==========================================================

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

  // ==========================================================
  // 5. SUPPRESSION
  // ==========================================================

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
    gererDuplicationTransaction,
    gererModificationTransaction,
    gererSuppressionTransaction,
  }
}