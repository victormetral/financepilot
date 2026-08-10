/*
  MIDDLEWARES D'AUTHENTIFICATION ET D'AUTORISATION

  Rôle général : 
  vérifier le JWT avant d'accéder aux routes protégées,
  et vérifier le rôle avant d'accéder aux routes
  réservées aux administrateurs.

  Utilisé par :
  - app.js (verifierAuthentification, sur tout /api sauf
    /api/auth et POST /api/utilisateurs)
  - actifFinancier.routes.js (verifierAdministrateur, sur
    POST/PUT/DELETE uniquement — 🟨 NOUVEAU)

  Format attendu :
  Authorization: Bearer <token>
*/

import jwt from "jsonwebtoken"

// Vérifie que le JWT est présent, bien formé et valide.
// Rend request.utilisateur disponible aux contrôleurs
// suivants (utilisateurId, email, role).
export const verifierAuthentification = (
  request,
  response,
  next
) => {
  const autorisation = request.headers.authorization

  if (!autorisation) {
    return response.status(401).json({
      message: "Authentification requise",
    })
  }

  const [type, token] = autorisation.split(" ")

  if (type !== "Bearer" || !token) {
    return response.status(401).json({
      message: "Format du jeton invalide",
    })
  }

  try {
    const utilisateurDecode = jwt.verify(
      token,
      process.env.JWT_SECRET
    )

    request.utilisateur = utilisateurDecode

    next()
  } catch (error) {
    return response.status(401).json({
      message: "Jeton invalide ou expiré",
    })
  }
}

/*
  🟨 NOUVEAU

  Vérifie que l'utilisateur connecté a le role
  "administrateur". Doit toujours être placé après
  verifierAuthentification dans une route, car il lit
  request.utilisateur.role.

  Utilisé pour protéger la modification du référentiel
  actif_financier (partagé entre tous les utilisateurs).
*/
export const verifierAdministrateur = (
  request,
  response,
  next
) => {
  if (request.utilisateur?.role !== "administrateur") {
    return response.status(403).json({
      message: "Accès réservé aux administrateurs",
    })
  }

  next()
}