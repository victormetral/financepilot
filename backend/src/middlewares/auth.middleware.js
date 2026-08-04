/*
  MIDDLEWARE D’AUTHENTIFICATION

  Rôle :
  vérifier le JWT avant d’accéder aux routes CRUD.

  Utilisé par :
  - les fichiers du dossier routes/

  Format attendu :
  Authorization: Bearer <token>
*/

import jwt from "jsonwebtoken"

// 🟨 NOUVEAU
export const verifierAuthentification = (
  request,
  response,
  next
) => {
  const autorisation =
    request.headers.authorization

  // Aucun jeton envoyé.
  if (!autorisation) {
    return response.status(401).json({
      message: "Authentification requise",
    })
  }

  const [type, token] =
    autorisation.split(" ")

  // Le format doit être : Bearer <token>
  if (type !== "Bearer" || !token) {
    return response.status(401).json({
      message: "Format du jeton invalide",
    })
  }

  try {
    // Vérifie la signature et l’expiration.
    const utilisateurDecode = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    // Rend l’utilisateur disponible au contrôleur.
    request.utilisateur = utilisateurDecode

    // Autorise la requête à continuer.
    next()
  } catch (error) {
    return response.status(401).json({
      message: "Jeton invalide ou expiré",
    })
  }
}