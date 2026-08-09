/*
  ACCOUNT VALIDATOR

  Valide et normalise les données des comptes avant
  leur envoi au contrôleur.

  Ce fichier ne contient ni requête SQL ni réponse HTTP.
*/

import {
  validationReussie,
  validationEchouee,
} from "../utils/validator.utils.js"

import {
  entierPositifEstValide,
  texteEstValide,
} from "../utils/validation.utils.js"

import {
  TYPES_COMPTE_AUTORISES,
  sousTypeCompteEstValide,
} from "../constants/compte.constants.js"

/*
  Valide un identifiant de compte reçu dans l'URL.

  Example:
  GET /api/comptes/3
*/
export const validerIdCompte = (id) => {
  const idNombre = Number(id)

  if (!entierPositifEstValide(idNombre)) {
    return validationEchouee(
      "L’identifiant du compte doit être un nombre entier supérieur à 0"
    )
  }

  return validationReussie({
    id: idNombre,
  })
}

/*
  Valide puis normalise le type et le sous-type ensemble.

  Règle métier :
  un sous-type doit appartenir au type de compte choisi.
*/
const validerTypeEtSousTypeCompte = (
  typeCompteBrut,
  sousTypeCompteBrut
) => {
  if (
    !texteEstValide(typeCompteBrut) ||
    !texteEstValide(sousTypeCompteBrut)
  ) {
    return validationEchouee(
      "type_compte et sous_type_compte doivent être des textes non vides"
    )
  }

  const typeCompte = typeCompteBrut.trim().toLowerCase()
  const sousTypeCompte = sousTypeCompteBrut.trim().toLowerCase()

  if (!TYPES_COMPTE_AUTORISES.includes(typeCompte)) {
    return validationEchouee("type_compte est invalide")
  }

  if (!sousTypeCompteEstValide(typeCompte, sousTypeCompte)) {
    return validationEchouee(
      "sous_type_compte est invalide pour ce type_compte"
    )
  }

  return validationReussie({
    typeCompte,
    sousTypeCompte,
  })
}

/*
  Valide les champs communs au POST et au PUT.

  Le solde peut être négatif : il représente par exemple
  un découvert bancaire.
*/
const validerDonneesCompte = ({
  nom,
  type_compte,
  sous_type_compte,
  solde_initial,
  devise,
}) => {
  if (!texteEstValide(nom)) {
    return validationEchouee("nom doit être un texte non vide")
  }

  const resultatTypeCompte = validerTypeEtSousTypeCompte(
    type_compte,
    sous_type_compte
  )

  if (!resultatTypeCompte.estValide) {
    return resultatTypeCompte
  }

  const soldeInitial = Number(solde_initial)

  if (!Number.isFinite(soldeInitial)) {
    return validationEchouee(
      "solde_initial doit être un nombre valide"
    )
  }

  if (!texteEstValide(devise)) {
    return validationEchouee("devise doit être un texte non vide")
  }

  return validationReussie({
    nom: nom.trim(),
    type_compte: resultatTypeCompte.donnees.typeCompte,
    sous_type_compte: resultatTypeCompte.donnees.sousTypeCompte,
    solde_initial: soldeInitial,
    devise: devise.trim().toUpperCase(),
  })
}

/*
  Valide la création d'un compte.

  Champs obligatoires :
  nom, type_compte et sous_type_compte.

  Valeurs par défaut :
  solde_initial = 0
  devise = EUR
*/
export const validerCreationCompte = (body) => {
  const {
    nom,
    type_compte,
    sous_type_compte,
    solde_initial = 0,
    devise = "EUR",
  } = body

  if (
    nom === undefined ||
    type_compte === undefined ||
    sous_type_compte === undefined
  ) {
    return validationEchouee(
      "nom, type_compte et sous_type_compte sont obligatoires"
    )
  }

  return validerDonneesCompte({
    nom,
    type_compte,
    sous_type_compte,
    solde_initial,
    devise,
  })
}

/*
  Valide la modification complète d'un compte.

  PUT exige tous les champs du compte.
  utilisateur_id ne peut jamais être modifié ici.
*/
export const validerModificationCompte = (body) => {
  const {
    nom,
    type_compte,
    sous_type_compte,
    solde_initial,
    devise,
  } = body

  if (
    nom === undefined ||
    type_compte === undefined ||
    sous_type_compte === undefined ||
    solde_initial === undefined ||
    devise === undefined
  ) {
    return validationEchouee(
      "nom, type_compte, sous_type_compte, solde_initial et devise sont obligatoires"
    )
  }

  return validerDonneesCompte({
    nom,
    type_compte,
    sous_type_compte,
    solde_initial,
    devise,
  })
}