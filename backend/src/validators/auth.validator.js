/*
  VALIDATEUR D’AUTHENTIFICATION

  Rôle :
  valider les informations envoyées lors
  de la connexion d’un utilisateur.

  Utilisé par :
  - auth.controller.js

  Route concernée :
  - POST /api/auth/connexion

  Ce fichier doit uniquement valider et nettoyer
  les données. Il ne doit pas :
  - interroger PostgreSQL ;
  - comparer les mots de passe avec bcrypt ;
  - créer de JWT ;
  - envoyer directement une réponse HTTP.
*/

// 🟨 NOUVEAU
import {
  validationReussie,
  validationEchouee,
} from "../utils/validator.utils.js"

// 🟨 NOUVEAU
import {
  emailEstValide,
  motDePasseEstValide,
} from "../utils/validation.utils.js"

/*
  Valide les identifiants de connexion.

  Données attendues :

  {
    "email": "victor@example.com",
    "mot_de_passe": "MotDePasse123!"
  }

  L’email est normalisé :
  - suppression des espaces extérieurs ;
  - conversion en minuscules.

  Le mot de passe n’est pas modifié :
  les espaces peuvent faire partie du mot de passe.
*/
// 🟨 NOUVEAU
export const validerConnexion = (body) => {
  const {
    email,
    mot_de_passe,
  } = body

  /*
    undefined signifie que le champ
    n’a pas été envoyé dans le JSON.
  */
  if (
    email === undefined ||
    mot_de_passe === undefined
  ) {
    return validationEchouee(
      "email et mot_de_passe sont obligatoires"
    )
  }

  if (!emailEstValide(email)) {
    return validationEchouee(
      "email doit avoir un format valide"
    )
  }

  /*
    On applique la même règle que pendant
    la création d’un utilisateur :
    au moins huit caractères.
  */
  if (!motDePasseEstValide(mot_de_passe)) {
    return validationEchouee(
      "mot_de_passe doit contenir au moins 8 caractères"
    )
  }

  return validationReussie({
    email: email.trim().toLowerCase(),
    mot_de_passe,
  })
}