/*
  ROUTES D’AUTHENTIFICATION

  Rôle :
  associer les URL d’authentification
  aux fonctions du contrôleur.

  Utilisé par :
  - app.js

  Contrôleur utilisé :
  - auth.controller.js

  Route finale :
  - POST /api/auth/connexion

  Ce fichier ne doit pas :
  - valider directement les données ;
  - interroger PostgreSQL ;
  - comparer les mots de passe ;
  - créer les JWT.
*/

// 🟨 NOUVEAU
import express from "express"

// 🟨 NOUVEAU
import {
  connecterUtilisateur,
} from "../controllers/auth.controller.js"

/*
  express.Router() crée un mini-routeur
  consacré aux routes d’authentification.
*/
// 🟨 NOUVEAU
const router = express.Router()

/*
  POST /connexion

  L’adresse complète deviendra :
  POST /api/auth/connexion

  Le préfixe /api/auth sera ajouté
  dans app.js à l’étape suivante.
*/
// 🟨 NOUVEAU
router.post(
  "/connexion",
  connecterUtilisateur
)

// 🟨 NOUVEAU
export default router