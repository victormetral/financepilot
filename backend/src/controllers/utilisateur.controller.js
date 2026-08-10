/*
  CONTRÔLEUR DES UTILISATEURS

  utilisateur.controller.js → orchestre les requêtes HTTP,
    récupère l'identité depuis le JWT, vérifie les doublons
    d'email, hache les mots de passe
  utilisateur.validator.js → valide et nettoie les données
  utilisateur.service.js → exécute les requêtes SQL, limite
    les opérations à l'utilisateur connecté
  bcryptjs → hache le mot de passe

  Règles de sécurité :
  - le mot de passe ne doit jamais apparaître dans une réponse ;
  - l'identité fiable vient du JWT ;
  - un utilisateur ne peut agir que sur son profil.

  Depuis Lot 3 : asyncHandler remplace le try/catch générique ;
  ErreurHTTP centralise les erreurs 400/404/409.
*/

import bcrypt from "bcryptjs"

import { asyncHandler } from "../middlewares/asyncHandler.middleware.js"
import { ErreurHTTP } from "../utils/erreurHttp.utils.js"

import {
  estErreurCleEtrangere,
  estErreurDoublon,
} from "../utils/postgres.utils.js"

import {
  findAllUtilisateurs,
  findUtilisateurById,
  findUtilisateurByEmail,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
} from "../services/utilisateur.service.js"

import {
  validerIdUtilisateur,
  validerDonneesUtilisateur,
} from "../validators/utilisateur.validator.js"

const NOMBRE_TOURS_HASH = 10

const hacherMotDePasse = async (motDePasse) => {
  return bcrypt.hash(motDePasse, NOMBRE_TOURS_HASH)
}

export const getUtilisateurs = asyncHandler(
  async (request, response) => {
    const utilisateurId = request.utilisateur.utilisateurId
    const utilisateurs = await findAllUtilisateurs(utilisateurId)
    response.json(utilisateurs)
  }
)

export const getUtilisateurById = asyncHandler(
  async (request, response) => {
    const validation = validerIdUtilisateur(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const utilisateurIdConnecte = request.utilisateur.utilisateurId

    const utilisateur = await findUtilisateurById(
      validation.donnees.id,
      utilisateurIdConnecte
    )

    if (!utilisateur) {
      throw new ErreurHTTP(404, "Utilisateur introuvable")
    }

    response.json(utilisateur)
  }
)

/*
  Route publique. Try/catch conservé : la vérification de
  doublon est faite en amont, mais une course entre cette
  vérification et l'insertion reste possible (23505).
*/
export const postUtilisateur = asyncHandler(
  async (request, response) => {
    const validation = validerDonneesUtilisateur(request.body)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const { nom, prenom, email, mot_de_passe } = validation.donnees

    const utilisateurExistant = await findUtilisateurByEmail(email)

    if (utilisateurExistant) {
      throw new ErreurHTTP(409, "Un utilisateur utilise déjà cet email")
    }

    const motDePasseHash = await hacherMotDePasse(mot_de_passe)

    try {
      const nouvelUtilisateur = await createUtilisateur({
        nom,
        prenom,
        email,
        mot_de_passe: motDePasseHash,
      })

      response.status(201).json(nouvelUtilisateur)
    } catch (error) {
      if (estErreurDoublon(error)) {
        throw new ErreurHTTP(409, "Un utilisateur utilise déjà cet email")
      }
      throw error
    }
  }
)

export const putUtilisateur = asyncHandler(
  async (request, response) => {
    const validationId = validerIdUtilisateur(request.params.id)

    if (!validationId.estValide) {
      throw new ErreurHTTP(400, validationId.message)
    }

    const utilisateurIdDemande = validationId.donnees.id
    const utilisateurIdConnecte = request.utilisateur.utilisateurId

    const utilisateurActuel = await findUtilisateurById(
      utilisateurIdDemande,
      utilisateurIdConnecte
    )

    if (!utilisateurActuel) {
      throw new ErreurHTTP(404, "Utilisateur introuvable")
    }

    const validationDonnees = validerDonneesUtilisateur(request.body)

    if (!validationDonnees.estValide) {
      throw new ErreurHTTP(400, validationDonnees.message)
    }

    const { nom, prenom, email, mot_de_passe } = validationDonnees.donnees

    const utilisateurAvecEmail = await findUtilisateurByEmail(email)

    // L'utilisateur connecté peut garder son email actuel ; un email d'un autre → 409.
    if (
      utilisateurAvecEmail &&
      utilisateurAvecEmail.id !== utilisateurIdConnecte
    ) {
      throw new ErreurHTTP(409, "Un utilisateur utilise déjà cet email")
    }

    const motDePasseHash = await hacherMotDePasse(mot_de_passe)

    try {
      const utilisateurModifie = await updateUtilisateur(
        utilisateurIdDemande,
        utilisateurIdConnecte,
        { nom, prenom, email, mot_de_passe: motDePasseHash }
      )

      if (!utilisateurModifie) {
        throw new ErreurHTTP(404, "Utilisateur introuvable")
      }

      response.json(utilisateurModifie)
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      if (estErreurDoublon(error)) {
        throw new ErreurHTTP(409, "Un utilisateur utilise déjà cet email")
      }
      throw error
    }
  }
)

export const deleteUtilisateurById = asyncHandler(
  async (request, response) => {
    const validation = validerIdUtilisateur(request.params.id)

    if (!validation.estValide) {
      throw new ErreurHTTP(400, validation.message)
    }

    const utilisateurIdConnecte = request.utilisateur.utilisateurId

    try {
      const utilisateurSupprime = await deleteUtilisateur(
        validation.donnees.id,
        utilisateurIdConnecte
      )

      if (!utilisateurSupprime) {
        throw new ErreurHTTP(404, "Utilisateur introuvable")
      }

      response.json({
        message: "Utilisateur supprimé",
        utilisateur: utilisateurSupprime,
      })
    } catch (error) {
      if (error instanceof ErreurHTTP) throw error

      // 23503 : encore propriétaire de comptes/catégories/budgets/objectifs.
      if (estErreurCleEtrangere(error)) {
        throw new ErreurHTTP(
          409,
          "Cet utilisateur possède encore des comptes, catégories, budgets ou objectifs"
        )
      }
      throw error
    }
  }
)