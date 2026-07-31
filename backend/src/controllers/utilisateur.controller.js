import bcrypt from "bcryptjs"

import {
  findAllUtilisateurs,
  findUtilisateurById,
  findUtilisateurByEmail,
  createUtilisateur,
  updateUtilisateur,
  deleteUtilisateur,
} from "../services/utilisateur.service.js"

// Nombre de tours utilisés pour sécuriser le hash
const nombreToursHash = 10

// Vérifier qu’un texte n’est pas vide
const texteEstValide = (texte) => {
  return (
    typeof texte === "string" &&
    texte.trim().length > 0
  )
}

// Vérifier le format général d’un email
const emailEstValide = (email) => {
  const formatEmail =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return (
    typeof email === "string" &&
    formatEmail.test(email)
  )
}

// Vérifier la solidité minimale du mot de passe
const motDePasseEstValide = (motDePasse) => {
  return (
    typeof motDePasse === "string" &&
    motDePasse.length >= 8
  )
}

// Récupérer tous les utilisateurs
export const getUtilisateurs = async (
  request,
  response
) => {
  try {
    const utilisateurs =
      await findAllUtilisateurs()

    response.json(utilisateurs)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération des utilisateurs",
      error: error.message,
    })
  }
}

// Récupérer un utilisateur par son identifiant
export const getUtilisateurById = async (
  request,
  response
) => {
  try {
    const utilisateurIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(utilisateurIdNombre) ||
      utilisateurIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’utilisateur doit être un nombre entier supérieur à 0",
      })
    }

    const utilisateur =
      await findUtilisateurById(
        utilisateurIdNombre
      )

    if (!utilisateur) {
      return response.status(404).json({
        message: "Utilisateur introuvable",
      })
    }

    response.json(utilisateur)
  } catch (error) {
    response.status(500).json({
      message:
        "Erreur lors de la récupération de l’utilisateur",
      error: error.message,
    })
  }
}

// Créer un utilisateur
export const postUtilisateur = async (
  request,
  response
) => {
  try {
    const {
      nom,
      prenom,
      email,
      mot_de_passe,
    } = request.body

    if (
      nom === undefined ||
      prenom === undefined ||
      email === undefined ||
      mot_de_passe === undefined
    ) {
      return response.status(400).json({
        message:
          "nom, prenom, email et mot_de_passe sont obligatoires",
      })
    }

    if (!texteEstValide(nom)) {
      return response.status(400).json({
        message:
          "nom doit être un texte non vide",
      })
    }

    if (!texteEstValide(prenom)) {
      return response.status(400).json({
        message:
          "prenom doit être un texte non vide",
      })
    }

    if (!emailEstValide(email)) {
      return response.status(400).json({
        message:
          "email doit avoir un format valide",
      })
    }

    if (!motDePasseEstValide(mot_de_passe)) {
      return response.status(400).json({
        message:
          "mot_de_passe doit contenir au moins 8 caractères",
      })
    }

    const emailNormalise =
      email.trim().toLowerCase()

    const utilisateurExistant =
      await findUtilisateurByEmail(
        emailNormalise
      )

    if (utilisateurExistant) {
      return response.status(409).json({
        message:
          "Un utilisateur utilise déjà cet email",
      })
    }

    // Transformer le mot de passe en hash sécurisé
    const motDePasseHash = await bcrypt.hash(
      mot_de_passe,
      nombreToursHash
    )

    const nouvelUtilisateur =
      await createUtilisateur({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: emailNormalise,
        mot_de_passe: motDePasseHash,
      })

    response.status(201).json(
      nouvelUtilisateur
    )
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        message:
          "Un utilisateur utilise déjà cet email",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la création de l’utilisateur",
      error: error.message,
    })
  }
}

// Modifier un utilisateur
export const putUtilisateur = async (
  request,
  response
) => {
  try {
    const utilisateurIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(utilisateurIdNombre) ||
      utilisateurIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’utilisateur doit être un nombre entier supérieur à 0",
      })
    }

    const utilisateurActuel =
      await findUtilisateurById(
        utilisateurIdNombre
      )

    if (!utilisateurActuel) {
      return response.status(404).json({
        message: "Utilisateur introuvable",
      })
    }

    const {
      nom,
      prenom,
      email,
      mot_de_passe,
    } = request.body

    if (
      nom === undefined ||
      prenom === undefined ||
      email === undefined ||
      mot_de_passe === undefined
    ) {
      return response.status(400).json({
        message:
          "nom, prenom, email et mot_de_passe sont obligatoires",
      })
    }

    if (!texteEstValide(nom)) {
      return response.status(400).json({
        message:
          "nom doit être un texte non vide",
      })
    }

    if (!texteEstValide(prenom)) {
      return response.status(400).json({
        message:
          "prenom doit être un texte non vide",
      })
    }

    if (!emailEstValide(email)) {
      return response.status(400).json({
        message:
          "email doit avoir un format valide",
      })
    }

    if (!motDePasseEstValide(mot_de_passe)) {
      return response.status(400).json({
        message:
          "mot_de_passe doit contenir au moins 8 caractères",
      })
    }

    const emailNormalise =
      email.trim().toLowerCase()

    const utilisateurAvecEmail =
      await findUtilisateurByEmail(
        emailNormalise
      )

    if (
      utilisateurAvecEmail &&
      utilisateurAvecEmail.id !==
        utilisateurIdNombre
    ) {
      return response.status(409).json({
        message:
          "Un utilisateur utilise déjà cet email",
      })
    }

    // Créer un nouveau hash pour le nouveau mot de passe
    const motDePasseHash = await bcrypt.hash(
      mot_de_passe,
      nombreToursHash
    )

    const utilisateurModifie =
      await updateUtilisateur(
        utilisateurIdNombre,
        {
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: emailNormalise,
          mot_de_passe: motDePasseHash,
        }
      )

    response.json(utilisateurModifie)
  } catch (error) {
    if (error.code === "23505") {
      return response.status(409).json({
        message:
          "Un utilisateur utilise déjà cet email",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la modification de l’utilisateur",
      error: error.message,
    })
  }
}

// Supprimer un utilisateur
export const deleteUtilisateurById = async (
  request,
  response
) => {
  try {
    const utilisateurIdNombre = Number(
      request.params.id
    )

    if (
      !Number.isInteger(utilisateurIdNombre) ||
      utilisateurIdNombre <= 0
    ) {
      return response.status(400).json({
        message:
          "L’identifiant de l’utilisateur doit être un nombre entier supérieur à 0",
      })
    }

    const utilisateurSupprime =
      await deleteUtilisateur(
        utilisateurIdNombre
      )

    if (!utilisateurSupprime) {
      return response.status(404).json({
        message: "Utilisateur introuvable",
      })
    }

    response.json({
      message: "Utilisateur supprimé",
      utilisateur: utilisateurSupprime,
    })
  } catch (error) {
    if (error.code === "23503") {
      return response.status(409).json({
        message:
          "Cet utilisateur possède encore des comptes, catégories, budgets ou objectifs",
      })
    }

    response.status(500).json({
      message:
        "Erreur lors de la suppression de l’utilisateur",
      error: error.message,
    })
  }
}