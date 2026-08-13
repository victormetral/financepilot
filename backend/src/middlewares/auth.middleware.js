/*
  MIDDLEWARE D'AUTHENTIFICATION

  Rôle : vérifier le JWT avant d'accéder aux routes CRUD, et
  vérifier le rôle administrateur pour les routes qui l'exigent
  (actif_financier en écriture, Lot 2).

  Depuis Lot 5, le JWT est lu depuis un cookie httpOnly plutôt
  que depuis le header Authorization.

  Utilisé par : les fichiers du dossier routes/
*/

import jwt from "jsonwebtoken"

export const verifierAuthentification = (request, response, next) => {
  const token = request.cookies?.token

  if (!token) {
    return response.status(401).json({
      message: "Authentification requise",
    })
  }

  try {
    const utilisateurDecode = jwt.verify(token, process.env.JWT_SECRET)
    request.utilisateur = utilisateurDecode
    next()
  } catch (error) {
    return response.status(401).json({
      message: "Jeton invalide ou expiré",
    })
  }
}

// Réservé aux routes en écriture sur actif_financier (Lot 2).
// Doit être placé après verifierAuthentification dans les routes.
export const verifierAdministrateur = (request, response, next) => {
  if (request.utilisateur?.role !== "administrateur") {
    return response.status(403).json({
      message: "Accès réservé aux administrateurs",
    })
  }

  next()
}