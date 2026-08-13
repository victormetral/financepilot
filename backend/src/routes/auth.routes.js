/*
  ROUTES D'AUTHENTIFICATION

  Rôle : associer les URL d'authentification aux fonctions
  du contrôleur.

  Utilisé par : app.js
  Contrôleur utilisé : auth.controller.js

  Routes finales :
  - POST /api/auth/connexion
  - POST /api/auth/deconnexion

  Ce fichier ne doit pas : valider les données, interroger
  PostgreSQL, comparer les mots de passe, créer les JWT.
*/

import express from "express"

import {
  connecterUtilisateur,
  deconnecterUtilisateur,
} from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/connexion", connecterUtilisateur)

// Le cookie JWT étant httpOnly, seul le serveur peut l'effacer :
// le frontend ne peut pas le supprimer lui-même en JavaScript.
router.post("/deconnexion", deconnecterUtilisateur)

export default router