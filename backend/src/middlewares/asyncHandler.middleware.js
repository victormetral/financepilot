/*
  WRAPPER ASYNCHRONE POUR LES CONTRÔLEURS

  Ce fichier évite de répéter try/catch dans chaque
  fonction de contrôleur.

  Utilisé par :
  - tous les fichiers controllers/*.controller.js

  Utilise :
  - rien (fonction générique Express)
*/

/*
  Enveloppe un contrôleur async.

  Si le contrôleur lève une erreur (ou rejette une promesse),
  elle est transmise à next(), qui déclenche
  erreurGlobale.middleware.js au lieu de faire planter le process.

  Exemple :
  export const getCategories = asyncHandler(async (request, response) => { ... })
*/
export const asyncHandler = (controleur) => {
  return (request, response, next) => {
    Promise.resolve(
      controleur(request, response, next)
    ).catch(next)
  }
}