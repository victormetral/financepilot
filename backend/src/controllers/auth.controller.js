/*
  CONTRÔLEUR D'AUTHENTIFICATION

  Rôle :
  connecter et déconnecter un utilisateur. Depuis Lot 5, le JWT
  est posé comme cookie httpOnly plutôt que renvoyé dans le JSON
  — invisible pour JavaScript, donc protégé contre le vol par XSS.

  Utilisé par :
  - auth.routes.js

  Routes concernées :
  - POST /api/auth/connexion
  - POST /api/auth/deconnexion

  Règles de sécurité :
  - ne jamais renvoyer mot_de_passe ;
  - ne jamais placer mot_de_passe dans le JWT ;
  - utiliser le même message pour un email inconnu
    et un mot de passe incorrect ;
  - le cookie JWT est httpOnly (inaccessible en JS).
*/

import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

import { findUtilisateurByEmail } from "../services/utilisateur.service.js"
import { validerConnexion } from "../validators/auth.validator.js"

const DUREE_JETON = "1h"
const NOM_COOKIE = "token"

/*
  Options du cookie JWT, réutilisées à la connexion et à la
  déconnexion (clearCookie doit recevoir les mêmes options que
  set pour fonctionner correctement dans tous les navigateurs).
*/
const optionsCookie = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 1000, // 1h, cohérent avec DUREE_JETON
}

export const connecterUtilisateur = async (request, response) => {
  try {
    const validation = validerConnexion(request.body)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const { email, mot_de_passe } = validation.donnees

    const utilisateur = await findUtilisateurByEmail(email)

    // Message volontairement imprécis : empêche de deviner si l'email existe.
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

    const token = jwt.sign(
      {
        utilisateurId: utilisateur.id,
        email: utilisateur.email,
        role: utilisateur.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: DUREE_JETON }
    )

    response.cookie(NOM_COOKIE, token, optionsCookie)

    return response.status(200).json({
      message: "Connexion réussie",
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
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

export const deconnecterUtilisateur = (request, response) => {
  response.clearCookie(NOM_COOKIE, optionsCookie)

  response.status(200).json({
    message: "Déconnexion réussie",
  })
}