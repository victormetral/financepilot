/*
  CONTRÔLEUR D’AUTHENTIFICATION

  Rôle :
  connecter un utilisateur avec son email
  et son mot de passe.

  Utilisé par :
  - auth.routes.js

  Route concernée :
  - POST /api/auth/connexion

  Étapes :
  1. valider les données reçues ;
  2. rechercher l’utilisateur par email ;
  3. comparer le mot de passe avec le hash PostgreSQL ;
  4. créer un JWT si les identifiants sont corrects ;
  5. renvoyer le jeton et les données publiques.

  Règles de sécurité :
  - ne jamais renvoyer mot_de_passe ;
  - ne jamais placer mot_de_passe dans le JWT ;
  - utiliser le même message pour un email inconnu
    et un mot de passe incorrect.
*/

// 🟨 NOUVEAU
import bcrypt from "bcryptjs"

// 🟨 NOUVEAU
import jwt from "jsonwebtoken"

// 🟨 NOUVEAU
import {
  findUtilisateurByEmail,
} from "../services/utilisateur.service.js"

// 🟨 NOUVEAU
import {
  validerConnexion,
} from "../validators/auth.validator.js"

/*
  Durée de validité du jeton.

  "1h" signifie :
  le JWT expirera une heure après sa création.
*/
// 🟨 NOUVEAU
const DUREE_JETON = "1h"

/*
  Connecte un utilisateur.

  Corps JSON attendu :

  {
    "email": "victor@example.com",
    "mot_de_passe": "MotDePasse123!"
  }
*/
// 🟨 NOUVEAU
export const connecterUtilisateur = async (
  request,
  response
) => {
  try {
    /*
      Le validateur vérifie les champs
      et normalise l’adresse email.
    */
    const validation =
      validerConnexion(request.body)

    if (!validation.estValide) {
      return response.status(400).json({
        message: validation.message,
      })
    }

    const {
      email,
      mot_de_passe,
    } = validation.donnees

    /*
      Cette fonction récupère exceptionnellement
      le hash du mot de passe pour l’authentification.
    */
    const utilisateur =
      await findUtilisateurByEmail(email)

    /*
      On utilise un message volontairement imprécis.

      Cela empêche un attaquant de savoir
      si une adresse email existe dans la base.
    */
    if (!utilisateur) {
      return response.status(401).json({
        message:
          "Email ou mot de passe incorrect",
      })
    }

    /*
      bcrypt.compare() compare :
      - le mot de passe en clair reçu ;
      - le hash enregistré dans PostgreSQL.

      Cette fonction renvoie true ou false.
    */
    const motDePasseCorrect =
      await bcrypt.compare(
        mot_de_passe,
        utilisateur.mot_de_passe
      )

    if (!motDePasseCorrect) {
      return response.status(401).json({
        message:
          "Email ou mot de passe incorrect",
      })
    }

    /*
      La clé secrète doit obligatoirement
      provenir du fichier .env.
    */
    if (!process.env.JWT_SECRET) {
      throw new Error(
        "La variable JWT_SECRET est absente"
      )
    }

    /*
      jwt.sign() crée et signe le jeton.

      Contenu du JWT :
      - utilisateurId : identité de l’utilisateur ;
      - email : adresse normalisée.

      Le mot de passe et son hash sont exclus.
    */
    const token = jwt.sign(
      {
        utilisateurId: utilisateur.id,
        email: utilisateur.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: DUREE_JETON,
      }
    )

    /*
      La réponse contient uniquement
      les informations publiques.
    */
    return response.status(200).json({
      message: "Connexion réussie",
      token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        date_creation:
          utilisateur.date_creation,
      },
    })
  } catch (error) {
    console.error(
      "Erreur de connexion :",
      error.message
    )

    return response.status(500).json({
      message:
        "Erreur interne lors de la connexion",
    })
  }
}