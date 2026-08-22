// ============================================================
// HOOK DES TRANSACTIONS
// ============================================================
//
// Rôle : charger la liste des transactions et gérer les
// opérations qui la modifient — création, duplication,
// modification, suppression.
//
// Depuis Lot 5 : plus de vérification de token en local, le
// cookie httpOnly gère l'authentification.
//
// Depuis Lot 9c : le filtrage se fait côté serveur, pas en
// mémoire. La liste est paginée : filtrer localement ne verrait
// que la page courante et donnerait des résultats faux.
//
// Depuis Lot 9d : rechargerListe est exposée sous le nom
// rechargerTransactions, pour que la génération automatique
// des récurrences puisse rafraîchir la liste après coup.
//
// L'état des filtres vit dans useTransactionsFiltres.js.
//
// Utilisé par : App.jsx
// Utilise : services/transaction.service.js,
//           hooks/useTransactionsFiltres.js

import { useCallback, useEffect, useState } from "react"

import {
  creerTransaction,
  modifierTransaction,
  recupererTransactions,
  supprimerTransaction,
} from "../services/transaction.service.js"

import { useTransactionsFiltres } from "./useTransactionsFiltres.js"

export function useTransactions(utilisateur, setMessage) {
  const [transactionsChargees, setTransactionsChargees] = useState([])
  const [transactionEnModification, setTransactionEnModification] = useState(null)

  const {
    filtres,
    gererChangementFiltre,
    gererReinitialisationFiltres,
  } = useTransactionsFiltres()

  /*
    Sans utilisateur connecté, la liste affichée est vide.

    C'est une valeur dérivée, calculée au rendu : vider l'état
    dans un effet provoquerait un rendu en cascade, ce que React
    déconseille.
  */
  const transactions = utilisateur ? transactionsChargees : []

  // ==========================================================
  // 1. CHARGEMENT AUTOMATIQUE
  // ==========================================================

  /*
    Recharge la liste à la connexion et à chaque changement
    de filtre.

    La fonction de chargement est déclarée à l'intérieur de
    l'effet, et non à l'extérieur : la règle ESLint
    react-hooks/set-state-in-effect interdit d'appeler depuis un
    effet une fonction extérieure qui modifie l'état. C'est ce
    qui explique la ressemblance avec rechargerListe ci-dessous.
  */
  useEffect(() => {
    if (!utilisateur) {
      return
    }

    async function charger() {
      try {
        const resultat = await recupererTransactions(filtres)

        if (resultat.ok) {
          setTransactionsChargees(resultat.donnees.transactions)
          return
        }

        setTransactionsChargees([])
        setMessage(resultat.donnees.message)
      } catch {
        setTransactionsChargees([])
        setMessage("Impossible de récupérer les transactions.")
      }
    }

    charger()
  }, [utilisateur, filtres, setMessage])

  /*
    Même chargement, déclenché manuellement après une création
    ou une modification. Les filtres actifs sont conservés,
    sinon créer une transaction pendant une recherche ferait
    réapparaître la liste entière.

    useCallback fige la référence de la fonction tant que les
    filtres ne changent pas. C'est nécessaire depuis le Lot 9d :
    la fonction est transmise à useRecurrences, qui la place
    dans les dépendances d'un effet. Recréée à chaque rendu,
    elle relancerait cet effet à chaque rendu.
  */
  const rechargerListe = useCallback(async () => {
    try {
      const resultat = await recupererTransactions(filtres)

      if (resultat.ok) {
        setTransactionsChargees(resultat.donnees.transactions)
      }
    } catch {
      setMessage("Impossible de récupérer les transactions.")
    }
  }, [filtres, setMessage])

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

      await rechargerListe()

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

      await rechargerListe()

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

  /*
    Retire la ligne de l'état local plutôt que de recharger la
    liste : la suppression est immédiate à l'écran, et une
    requête de moins part au serveur.
  */
  async function gererSuppressionTransaction(transactionId) {
    try {
      const resultat = await supprimerTransaction(transactionId)

      if (resultat.ok) {
        setTransactionsChargees((transactionsActuelles) =>
          transactionsActuelles.filter(
            (transaction) => transaction.id !== transactionId
          )
        )
      }

      setMessage(resultat.donnees.message)
    } catch {
      setMessage("Impossible de supprimer la transaction.")
    }
  }

  return {
    transactions,
    transactionEnModification,
    setTransactionEnModification,
    filtres,
    gererChangementFiltre,
    gererReinitialisationFiltres,
    gererCreationTransaction,
    gererDuplicationTransaction,
    gererModificationTransaction,
    gererSuppressionTransaction,
    // Nom explicite hors du hook : le contexte partagé entre
    // toutes les pages contient plusieurs listes.
    rechargerTransactions: rechargerListe,
  }
}