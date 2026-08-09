/*
  CONSTANTES DES COMPTES

  Ce fichier centralise les familles de comptes
  et leurs sous-types autorisés.
*/

export const TYPES_COMPTE_AUTORISES = [
  "courant",
  "epargne",
  "investissement",
  "credit",
  "pret",
]

export const SOUS_TYPES_COMPTE_PAR_TYPE = {
  courant: ["compte_courant"],
  epargne: [
    "livret_a",
    "ldds",
    "lep",
    "pel",
    "cel",
    "autre_epargne",
  ],
  investissement: [
    "pea",
    "assurance_vie",
    "cto",
    "crypto",
    "autre_investissement",
  ],
  credit: ["carte_credit"],
  pret: [
    "pret_immobilier",
    "pret_consommation",
    "autre_pret",
  ],
}

export const sousTypeCompteEstValide = (
  typeCompte,
  sousTypeCompte
) => {
  return SOUS_TYPES_COMPTE_PAR_TYPE[typeCompte]
    ?.includes(sousTypeCompte) ?? false
}