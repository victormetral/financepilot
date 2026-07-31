/*
  OUTILS COMMUNS DE PAGINATION

  Ce fichier centralise les calculs utilisés pour découper
  les résultats en plusieurs pages.

  Utilisé notamment par :
  - transaction.controller.js
  - budget.controller.js

  Terminologie :
  - limite : nombre maximal de résultats par page ;
  - page : page demandée ;
  - offset : nombre de résultats à ignorer ;
  - total : nombre total de résultats disponibles.

  Exemple :
  page = 2
  limite = 20
  offset = 20

  Victor :
  les requêtes SQL restent dans les services.
  Ce fichier effectue uniquement les calculs.
*/

// Valeurs par défaut utilisées par l’API
export const LIMITE_PAR_DEFAUT = 20
export const LIMITE_MAXIMALE = 100
export const PAGE_PAR_DEFAUT = 1

/*
  Convertit les paramètres reçus dans l’URL.

  Les paramètres request.query arrivent sous forme de texte.

  Exemple :
  "3" devient 3.
*/
export const convertirPagination = ({
  limite,
  page,
}) => {
  const limiteNombre =
    limite !== undefined
      ? Number(limite)
      : LIMITE_PAR_DEFAUT

  const pageNombre =
    page !== undefined
      ? Number(page)
      : PAGE_PAR_DEFAUT

  return {
    limiteNombre,
    pageNombre,
  }
}

/*
  Vérifie que la limite est un entier compris
  entre 1 et la limite maximale.
*/
export const limiteEstValide = (limite) => {
  return (
    Number.isInteger(limite) &&
    limite >= 1 &&
    limite <= LIMITE_MAXIMALE
  )
}

/*
  Vérifie que le numéro de page est un entier
  strictement supérieur à zéro.
*/
export const pageEstValide = (page) => {
  return (
    Number.isInteger(page) &&
    page > 0
  )
}

/*
  Calcule le nombre de résultats à ignorer.

  Formule :
  offset = (page - 1) × limite
*/
export const calculerOffset = (
  page,
  limite
) => {
  return (page - 1) * limite
}

/*
  Calcule le nombre total de pages.

  Math.ceil() arrondit vers le haut.

  Exemple :
  13 résultats ÷ 3 par page = 4,33
  donc 5 pages.
*/
export const calculerTotalPages = (
  total,
  limite
) => {
  return Math.ceil(total / limite)
}

/*
  Construit toutes les informations de pagination
  renvoyées dans la réponse JSON.

  Cette fonction évite de refaire les mêmes calculs
  dans chaque contrôleur.
*/
export const creerPagination = ({
  total,
  limite,
  page,
}) => {
  const totalPages =
    calculerTotalPages(total, limite)

  const offset =
    calculerOffset(page, limite)

  const hasPrevious = page > 1

  const hasNext = page < totalPages

  return {
    total,
    limite,
    offset,
    page,
    total_pages: totalPages,
    has_previous: hasPrevious,
    has_next: hasNext,
    previous_page: hasPrevious
      ? page - 1
      : null,
    next_page: hasNext
      ? page + 1
      : null,
  }
}

/*
  Vérifie qu’une page demandée existe.

  Lorsque total vaut 0, la page 1 reste acceptée
  afin de pouvoir renvoyer une liste vide normalement.
*/
export const pageExiste = ({
  total,
  page,
  limite,
}) => {
  if (total === 0) {
    return page === 1
  }

  const totalPages =
    calculerTotalPages(total, limite)

  return page <= totalPages
}