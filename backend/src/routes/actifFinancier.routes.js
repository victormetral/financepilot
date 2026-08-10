/*
  ROUTES DES ACTIFS FINANCIERS

  Rôle général :
  associe les URL des actifs financiers aux fonctions
  de actifFinancier.controller.js.

  Utilisé par :
  - app.js (préfixe /api/actifs-financiers)

  Utilise :
  - actifFinancier.controller.js
  - auth.middleware.js (verifierAdministrateur)

  🟨 NOUVEAU — décision produit :
  actif_financier est un référentiel partagé entre tous
  les utilisateurs. GET reste ouvert à tout utilisateur
  connecté (nécessaire pour créer une opération
  d'investissement), mais POST/PUT/DELETE sont réservés
  aux administrateurs pour empêcher qu'un utilisateur
  modifie des données utilisées par d'autres.
*/

import express from "express"

import {
  getActifsFinanciers,
  getActifFinancierById,
  postActifFinancier,
  putActifFinancier,
  deleteActifFinancierById,
} from "../controllers/actifFinancier.controller.js"

import {
  verifierAdministrateur,
} from "../middlewares/auth.middleware.js"

const router = express.Router()

// Lecture : ouverte à tout utilisateur connecté.
router.get("/", getActifsFinanciers)
router.get("/:id", getActifFinancierById)

// Écriture : réservée aux administrateurs.
router.post("/", verifierAdministrateur, postActifFinancier)
router.put("/:id", verifierAdministrateur, putActifFinancier)
router.delete(
  "/:id",
  verifierAdministrateur,
  deleteActifFinancierById
)

export default router