/*
  MIDDLEWARE D'ERREUR GLOBALE

  Ce fichier centralise la transformation des erreurs
  en réponses HTTP.

  Doit être monté en DERNIER dans app.js,
  après toutes les routes.

  Utilise :
  - postgres.utils.js (codes PostgreSQL, filet de sécurité)
  - erreurHttp.utils.js (ErreurHTTP)

  Utilisé par :
  - app.js
*/

import {
  estErreurDoublon,
  estErreurCleEtrangere,
} from "../utils/postgres.utils.js"

import { ErreurHTTP } from "../utils/erreurHttp.utils.js"

/*
  Traite toute erreur remontée par asyncHandler.

  Ordre de priorité :
  1. ErreurHTTP levée volontairement par un contrôleur
     → message métier précis déjà connu.
  2. Erreur PostgreSQL 23505 / 23503 non transformée
     → filet de sécurité générique (409), si un contrôleur
       a oublié de la convertir en ErreurHTTP.
  3. Tout le reste
     → 500 générique.
*/
export const erreurGlobale = (
  error,
  request,
  response,
  next
) => {
  if (error instanceof ErreurHTTP) {
    return response.status(error.statusCode).json({
      message: error.message,
    })
  }

  if (estErreurDoublon(error)) {
    return response.status(409).json({
      message: "Cette ressource existe déjà",
    })
  }

  if (estErreurCleEtrangere(error)) {
    return response.status(409).json({
      message:
        "Impossible d'effectuer cette opération : ressource encore référencée",
    })
  }

  console.error(error)

  response.status(500).json({
    message: "Erreur interne du serveur",
    error: error.message,
  })
}