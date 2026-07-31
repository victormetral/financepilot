/*
  CONSTANTES DES TRANSACTIONS

  Ce fichier contient les valeurs autorisées pour
  type_transaction.

  Utilisé par :
  - transaction.controller.js

  Victor :
  si un nouveau type de transaction est ajouté,
  ajoute-le ici.

  Vérifie également que la base PostgreSQL autorise
  cette nouvelle valeur.
*/

export const TYPES_TRANSACTION_AUTORISES = [
  "revenu",
  "depense",
  "transfert",
]