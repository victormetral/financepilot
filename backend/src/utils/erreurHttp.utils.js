/*
  ERREUR HTTP MÉTIER

  Ce fichier définit une classe d'erreur utilisable
  dans les contrôleurs pour signaler une erreur métier
  avec son statut HTTP associé.

  Utilisé par :
  - tous les contrôleurs (postCategorie, putCompte, etc.)
  - erreurGlobale.middleware.js (pour lire statusCode)

  Utilise :
  - rien (classe autonome)
*/

/*
  Erreur métier porteuse d'un statusCode HTTP.

  Exemple :
  throw new ErreurHTTP(404, "Catégorie introuvable")
*/
export class ErreurHTTP extends Error {
  constructor(statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}