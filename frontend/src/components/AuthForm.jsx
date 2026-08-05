// ============================================================
// FORMULAIRE D'AUTHENTIFICATION
// ============================================================
//
// Rôle : afficher la connexion ou l'inscription.
// Utilisé par : App.jsx.
//
// Le composant conserve les valeurs des champs.
// App.jsx conserve les actions qui modifient l'état général.

import { useState } from "react"

function AuthForm({ onConnexion, onInscription }) {
  const [email, setEmail] = useState("")
  const [motDePasse, setMotDePasse] = useState("")
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [modeInscription, setModeInscription] =
    useState(false)

  async function gererEnvoi(event) {
    event.preventDefault()

    if (modeInscription) {
      const inscriptionReussie = await onInscription({
        nom,
        prenom,
        email,
        motDePasse
      })

      if (inscriptionReussie) {
        setModeInscription(false)
        setMotDePasse("")
      }

      return
    }

    await onConnexion(email, motDePasse)
  }

  return (
    <>
      <h2>
        {modeInscription
          ? "Créer un compte"
          : "Connexion"}
      </h2>

      <form onSubmit={gererEnvoi}>
        {modeInscription && (
          <>
            <label htmlFor="nom">Nom</label>
            <input
              id="nom"
              type="text"
              value={nom}
              onChange={(event) =>
                setNom(event.target.value)
              }
              required
            />

            <label htmlFor="prenom">Prénom</label>
            <input
              id="prenom"
              type="text"
              value={prenom}
              onChange={(event) =>
                setPrenom(event.target.value)
              }
              required
            />
          </>
        )}

        <label htmlFor="email">Adresse email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          required
        />

        <label htmlFor="motDePasse">Mot de passe</label>
        <input
          id="motDePasse"
          type="password"
          value={motDePasse}
          onChange={(event) =>
            setMotDePasse(event.target.value)
          }
          required
        />

        <button type="submit">
          {modeInscription
            ? "Créer mon compte"
            : "Se connecter"}
        </button>
      </form>

      <button
        type="button"
        onClick={() =>
          setModeInscription((modeActuel) => !modeActuel)
        }
      >
        {modeInscription
          ? "J’ai déjà un compte"
          : "Créer un compte"}
      </button>
    </>
  )
}

export default AuthForm
