/*
  CONTRÔLEUR D'AUTHENTIFICATION

  Rôle général :
  connecter un utilisateur avec son email
  et son mot de passe.

  Utilisé par :
  - auth.routes.js

  Utilise :
  - utilisateur.service.js (findUtilisateurByEmail)
  - auth.validator.js (validerConnexion)

  Route concernée :
  - POST /api/auth/connexion

  Règles de sécurité :
  - ne jamais renvoyer mot_de_passe ;
  - ne jamais placer mot_de_passe dans le JWT ;
  - utiliser le même message pour un email inconnu
    et un mot de passe incorrect ;
  - inclure le role dans le JWT (🟨 NOUVEAU) pour que
    verifierAdministrateur puisse le lire sans requête
    SQL supplémentaire.
*/

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import {
  findUtilisateurByEmail,
} from "../services/utilisateur.service.js"

import {
  validerConnexion,
} from "../validators/auth.validator.js"

// Durée de validité du jeton.
const DUREE_JETON = "1h"

// Connecte un utilisateur et renvoie un JWT.
export const connecterUtilisateur = async (
  request,
  response
) => {
  try {
    const validation = validerConnexion(request.body)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    } 

    const { email, mot_de_passe } = validation.donnees

    const utilisateur = await findUtilisateurByEmail(email)

    // Message volontairement imprécis : empêche un
    // attaquant de savoir si l'email existe en base.
    if (!utilisateur) {
      return response.status(401).json({
        message: "Email ou mot de passe incorrect",
      })
    }

    const motDePasseCorrect = await bcrypt.compare(
      mot_de_passe,
      utilisateur.mot_de_passe
    )

    if (!motDePasseCorrect) {
      return response.status(401).json({
        message: "Email ou mot de passe incorrect",
      })
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("La variable JWT_SECRET est absente")
    }

    /*
      🟨 NOUVEAU
      Le JWT contient désormais aussi le role, pour que
      verifierAdministrateur (auth.middleware.js) puisse
      protéger certaines routes sans requête SQL.
    */
    const token = jwt.sign(
      {
        utilisateurId: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: DUREE_JETON }
    )

    return response.status(200).json({
      message: "Connexion réussie",
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        date_creation: utilisateur.date_creation,
      },
    })
  } catch (error) {
    console.error("Erreur de connexion :", error.message)

    return response.status(500).json({
      message: "Erreur interne lors de la connexion",
    })
  }
}