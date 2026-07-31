/*
  OUTILS COMMUNS DE VALIDATION

  Ce fichier contient les validations simples répétées
  dans plusieurs contrôleurs.

  Il permet de vérifier :
  - les identifiants ;
  - les nombres ;
  - les textes ;
  - les emails ;
  - les mots de passe.

  Victor :
  ce fichier répond uniquement par true ou false.

  Il ne doit pas :
  - envoyer de réponse HTTP ;
  - utiliser response.status() ;
  - interroger PostgreSQL.

  Le contrôleur décide ensuite quel message et quel statut
  HTTP renvoyer.
*/

/*
  Vérifie qu’une valeur est un entier strictement positif.

  Exemples valides :
  1, 2, 50

  Exemples invalides :
  0, -1, 2.5, NaN
*/
export const entierPositifEstValide = (
  valeur
) => {
  return (
    Number.isInteger(valeur) &&
    valeur > 0
  )
}

/*
  Vérifie qu’une valeur est un entier positif ou nul.

  Exemples valides :
  0, 1, 10

  Exemple d’utilisation :
  - offset de pagination
*/
export const entierPositifOuNulEstValide = (
  valeur
) => {
  return (
    Number.isInteger(valeur) &&
    valeur >= 0
  )
}

/*
  Vérifie qu’une valeur est un nombre fini
  strictement supérieur à zéro.

  Exemples valides :
  10
  10.50

  Exemples invalides :
  0
  -10
  NaN
  Infinity
*/
export const nombrePositifEstValide = (
  valeur
) => {
  return (
    Number.isFinite(valeur) &&
    valeur > 0
  )
}

/*
  Vérifie qu’une valeur est un nombre fini
  supérieur ou égal à zéro.

  Exemple d’utilisation :
  - frais d’investissement ;
  - montant actuel d’un objectif.
*/
export const nombrePositifOuNulEstValide = (
  valeur
) => {
  return (
    Number.isFinite(valeur) &&
    valeur >= 0
  )
}

/*
  Vérifie qu’une valeur est un texte non vide.

  trim() retire les espaces au début et à la fin.

  Exemple invalide :
  "     "
*/
export const texteEstValide = (texte) => {
  return (
    typeof texte === "string" &&
    texte.trim().length > 0
  )
}

/*
  Vérifie la forme générale d’une adresse email.

  Cette validation ne garantit pas que l’adresse existe.
  Elle vérifie seulement une structure comme :

  texte@domaine.extension
*/
export const emailEstValide = (email) => {
  const formatEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return (
    typeof email === "string" &&
    formatEmail.test(email)
  )
}

/*
  Vérifie la longueur minimale d’un mot de passe.

  Cette première règle impose seulement 8 caractères.

  Plus tard, elle pourra être renforcée avec :
  - une majuscule ;
  - une minuscule ;
  - un chiffre ;
  - un caractère spécial.
*/
export const motDePasseEstValide = (
  motDePasse
) => {
  return (
    typeof motDePasse === "string" &&
    motDePasse.length >= 8
  )
}

/*
  Vérifie qu’un mois est un entier compris entre 1 et 12.
*/
export const moisEstValide = (mois) => {
  return (
    Number.isInteger(mois) &&
    mois >= 1 &&
    mois <= 12
  )
}

/*
  Vérifie qu’une année respecte les limites actuelles
  de FinancePilot.

  Cette limite évite des années manifestement incorrectes.
*/
export const anneeEstValide = (annee) => {
  return (
    Number.isInteger(annee) &&
    annee >= 2000 &&
    annee <= 2100
  )
}

/*
  Vérifie qu’une valeur appartient à une liste autorisée.

  Exemple :
  valeurEstAutorisee("depense", [
    "revenu",
    "depense",
    "transfert",
  ])
*/
export const valeurEstAutorisee = (
  valeur,
  valeursAutorisees
) => {
  return valeursAutorisees.includes(valeur)
}