/*
  OUTILS COMMUNS POUR LES VALIDATEURS

  Ce fichier centralise la forme des résultats
  renvoyés par tous les validateurs de FinancePilot.

  Utilisé par :
  - utilisateur.validator.js
  - compte.validator.js
  - categorie.validator.js
  - transaction.validator.js
  - budget.validator.js
  - objectif.validator.js
  - actifFinancier.validator.js
  - operationInvestissement.validator.js

  Un validateur ne renvoie pas directement
  de réponse HTTP.

  Il renvoie soit une réussite :

  {
    estValide: true,
    donnees: {...}
  }

  soit un échec :

  {
    estValide: false,
    message: "Description de l’erreur"
  }

  Victor :
  ces fonctions permettent d’éviter de recopier
  la même structure dans chaque validateur.
*/

/*
  Construit le résultat d’une validation réussie.

  donnees contient les valeurs validées, nettoyées
  et éventuellement transformées.

  Exemple :

  validationReussie({
    id: 3
  })
*/
export const validationReussie = (donnees) => {
  return {
    estValide: true,
    donnees,
  }
}

/*
  Construit le résultat d’une validation échouée.

  message explique précisément pourquoi
  les données ont été refusées.

  Exemple :

  validationEchouee(
    "L’identifiant doit être supérieur à 0"
  )
*/
export const validationEchouee = (message) => {
  return {
    estValide: false,
    message,
  }
}