/*
  OUTILS COMMUNS POUR LES ERREURS POSTGRESQL

  Ce fichier centralise les codes d’erreur PostgreSQL
  utilisés dans plusieurs contrôleurs.

  Utilisé notamment par :
  - utilisateur.controller.js
  - compte.controller.js
  - categorie.controller.js
  - transaction.controller.js
  - budget.controller.js
  - objectif.controller.js
  - actifFinancier.controller.js
  - operationInvestissement.controller.js

  Codes actuellement utilisés :

  23503
  → violation de clé étrangère
  → relation inexistante ou ressource encore utilisée

  23505
  → violation d’une contrainte UNIQUE
  → doublon

  Victor :
  ce fichier ne choisit pas le message HTTP à envoyer.

  Chaque contrôleur garde son message précis,
  car une erreur 23503 peut signifier des choses
  différentes selon la ressource.
*/

/*
  Codes officiels renvoyés par PostgreSQL.

  Les noms en majuscules indiquent des constantes :
  leur valeur ne doit pas être modifiée pendant
  l’exécution du programme.
*/
export const CODE_CLE_ETRANGERE = "23503"
export const CODE_DOUBLON = "23505"

/*
  Vérifie si une erreur correspond à une violation
  de clé étrangère.

  Exemples :
  - utilisateur inexistant lors de la création ;
  - compte encore utilisé lors de la suppression.
*/
export const estErreurCleEtrangere = (error) => {
  return error?.code === CODE_CLE_ETRANGERE
}

/*
  Vérifie si une erreur correspond à une violation
  d’une contrainte UNIQUE.

  Exemples :
  - email déjà utilisé ;
  - catégorie déjà existante ;
  - actif financier déjà enregistré.
*/
export const estErreurDoublon = (error) => {
  return error?.code === CODE_DOUBLON
}