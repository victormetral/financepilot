import { useEffect, useState } from "react"

function App() {
  // ==================================================
  // ÉTATS DE L’AUTHENTIFICATION
  // ==================================================

  const [email, setEmail] = useState("")
  const [motDePasse, setMotDePasse] = useState("")
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [modeInscription, setModeInscription] =
    useState(false)
  const [message, setMessage] = useState("")
  const [utilisateur, setUtilisateur] = useState(null)

  // ==================================================
  // ÉTATS DES COMPTES BANCAIRES
  // ==================================================

  const [comptes, setComptes] = useState([])
  const [nomCompte, setNomCompte] = useState("")
  const [typeCompte, setTypeCompte] = useState("")

  // 🟨 NOUVEAU : compte actuellement modifié
  const [
    compteEnModification,
    setCompteEnModification
  ] = useState(null)

  // 🟨 NOUVEAU : valeurs du formulaire de modification
  const [
    nomCompteModifie,
    setNomCompteModifie
  ] = useState("")

  const [
    typeCompteModifie,
    setTypeCompteModifie
  ] = useState("")

  const [
    soldeCompteModifie,
    setSoldeCompteModifie
  ] = useState("")

  const [
    deviseCompteModifie,
    setDeviseCompteModifie
  ] = useState("")

  // ==================================================
  // RESTAURATION DE LA CONNEXION
  // ==================================================

  useEffect(() => {
    async function restaurerConnexion() {
      const token = localStorage.getItem("token")

      if (!token) {
        return
      }

      try {
        const reponse = await fetch(
          "http://localhost:3000/api/utilisateurs",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        if (reponse.ok) {
          const donnees = await reponse.json()

          setUtilisateur(donnees[0])
        } else {
          localStorage.removeItem("token")
          setUtilisateur(null)
        }
      } catch (error) {
        setMessage(
          "Impossible de contacter le serveur."
        )
      }
    }

    restaurerConnexion()
  }, [])

  // ==================================================
  // CHARGEMENT DES COMPTES
  // ==================================================

  useEffect(() => {
    async function chargerComptes() {
      const token = localStorage.getItem("token")

      if (!utilisateur || !token) {
        return
      }

      try {
        const reponse = await fetch(
          "http://localhost:3000/api/comptes",
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const donnees = await reponse.json()

        if (reponse.ok) {
          setComptes(donnees)
        } else {
          setComptes([])
          setMessage(donnees.message)
        }
      } catch (error) {
        setComptes([])

        setMessage(
          "Impossible de récupérer les comptes."
        )
      }
    }

    chargerComptes()
  }, [utilisateur])

  // ==================================================
  // CONNEXION
  // ==================================================

  async function gererConnexion(event) {
    event.preventDefault()

    const options = {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        email: email,
        mot_de_passe: motDePasse
      })
    }

    try {
      const reponse = await fetch(
        "http://localhost:3000/api/auth/connexion",
        options
      )

      const donnees = await reponse.json()

      setMessage(donnees.message)

      if (reponse.ok) {
        localStorage.setItem(
          "token",
          donnees.token
        )

        setUtilisateur(donnees.utilisateur)
      } else {
        localStorage.removeItem("token")
        setUtilisateur(null)
        setComptes([])
      }
    } catch (error) {
      setMessage(
        "Impossible de contacter le serveur."
      )
    }
  }

  // ==================================================
  // INSCRIPTION
  // ==================================================

  async function gererInscription(event) {
    event.preventDefault()

    const options = {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        nom: nom,
        prenom: prenom,
        email: email,
        mot_de_passe: motDePasse
      })
    }

    try {
      const reponse = await fetch(
        "http://localhost:3000/api/utilisateurs",
        options
      )

      const donnees = await reponse.json()

      if (reponse.ok) {
        setMessage(
          "Compte créé. Vous pouvez vous connecter."
        )

        setModeInscription(false)
        setMotDePasse("")
      } else {
        setMessage(donnees.message)
      }
    } catch (error) {
      setMessage(
        "Impossible de contacter le serveur."
      )
    }
  }

  // ==================================================
  // CRÉATION D’UN COMPTE BANCAIRE
  // ==================================================

  async function gererCreationCompte(event) {
    event.preventDefault()

    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    const options = {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify({
        nom: nomCompte,
        type_compte: typeCompte
      })
    }

    try {
      const reponse = await fetch(
        "http://localhost:3000/api/comptes",
        options
      )

      const donnees = await reponse.json()

      if (reponse.ok) {
        setComptes((comptesActuels) => [
          ...comptesActuels,
          donnees
        ])

        setNomCompte("")
        setTypeCompte("")
        setMessage("Compte bancaire créé.")
      } else {
        setMessage(donnees.message)
      }
    } catch (error) {
      setMessage(
        "Impossible de créer le compte bancaire."
      )
    }
  }

  // ==================================================
  // 🟨 NOUVEAU : PRÉPARATION DE LA MODIFICATION
  // ==================================================

  function demarrerModification(compte) {
    setCompteEnModification(compte.id)

    // Préremplit le formulaire avec les valeurs actuelles.
    setNomCompteModifie(compte.nom)
    setTypeCompteModifie(compte.type_compte)
    setSoldeCompteModifie(compte.solde_initial)
    setDeviseCompteModifie(compte.devise)

    setMessage("")
  }

  // ==================================================
  // 🟨 NOUVEAU : MODIFICATION D’UN COMPTE
  // ==================================================

  async function gererModificationCompte(event) {
    event.preventDefault()

    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    const options = {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },

      body: JSON.stringify({
        nom: nomCompteModifie,
        type_compte: typeCompteModifie,

        // Number transforme le texte de l’input en nombre.
        solde_initial: Number(
          soldeCompteModifie
        ),

        devise: deviseCompteModifie
      })
    }

    try {
      const reponse = await fetch(
        `http://localhost:3000/api/comptes/${compteEnModification}`,
        options
      )

      const donnees = await reponse.json()

      if (reponse.ok) {
        // Remplace l’ancien compte par le compte modifié.
        setComptes((comptesActuels) =>
          comptesActuels.map((compte) =>
            compte.id === donnees.id
              ? donnees
              : compte
          )
        )

        setCompteEnModification(null)

        setMessage(
          "Compte bancaire modifié avec succès."
        )
      } else {
        setMessage(donnees.message)
      }
    } catch (error) {
      setMessage(
        "Impossible de modifier le compte bancaire."
      )
    }
  }

  // ==================================================
  // 🟨 NOUVEAU : ANNULATION DE LA MODIFICATION
  // ==================================================

  function annulerModification() {
    setCompteEnModification(null)
    setMessage("")
  }

  // ==================================================
  // SUPPRESSION D’UN COMPTE
  // ==================================================

  async function gererSuppressionCompte(compteId) {
    const token = localStorage.getItem("token")

    if (!token) {
      setMessage("Vous devez être connecté.")
      return
    }

    const options = {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`
      }
    }

    try {
      const reponse = await fetch(
        `http://localhost:3000/api/comptes/${compteId}`,
        options
      )

      const donnees = await reponse.json()

      if (reponse.ok) {
        setComptes((comptesActuels) =>
          comptesActuels.filter(
            (compte) => compte.id !== compteId
          )
        )

        setMessage(donnees.message)
      } else {
        setMessage(donnees.message)
      }
    } catch (error) {
      setMessage(
        "Impossible de supprimer le compte bancaire."
      )
    }
  }

  // ==================================================
  // DÉCONNEXION
  // ==================================================

  function gererDeconnexion() {
    localStorage.removeItem("token")
    setUtilisateur(null)
    setComptes([])
    setCompteEnModification(null)
    setMessage("Déconnexion réussie")
  }

  // ==================================================
  // AFFICHAGE
  // ==================================================

  return (
    <main>
      <h1>FinancePilot</h1>

      <p>Gérez vos finances simplement.</p>

      <section>
        {!utilisateur && (
          <>
            <h2>
              {modeInscription
                ? "Créer un compte"
                : "Connexion"}
            </h2>

            {modeInscription ? (
              <form onSubmit={gererInscription}>
                <label htmlFor="nom">
                  Nom
                </label>

                <input
                  id="nom"
                  type="text"
                  value={nom}
                  onChange={(event) =>
                    setNom(event.target.value)
                  }
                />

                <label htmlFor="prenom">
                  Prénom
                </label>

                <input
                  id="prenom"
                  type="text"
                  value={prenom}
                  onChange={(event) =>
                    setPrenom(event.target.value)
                  }
                />

                <label htmlFor="email">
                  Adresse email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />

                <label htmlFor="motDePasse">
                  Mot de passe
                </label>

                <input
                  id="motDePasse"
                  type="password"
                  value={motDePasse}
                  onChange={(event) =>
                    setMotDePasse(
                      event.target.value
                    )
                  }
                />

                <button type="submit">
                  Créer mon compte
                </button>
              </form>
            ) : (
              <form onSubmit={gererConnexion}>
                <label htmlFor="email">
                  Adresse email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                />

                <label htmlFor="motDePasse">
                  Mot de passe
                </label>

                <input
                  id="motDePasse"
                  type="password"
                  value={motDePasse}
                  onChange={(event) =>
                    setMotDePasse(
                      event.target.value
                    )
                  }
                />

                <button type="submit">
                  Se connecter
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => {
                setModeInscription(
                  !modeInscription
                )

                setMessage("")
              }}
            >
              {modeInscription
                ? "J’ai déjà un compte"
                : "Créer un compte"}
            </button>
          </>
        )}

        {message && <p>{message}</p>}

        {utilisateur && (
          <div>
            <h2>Utilisateur connecté</h2>

            <p>
              Email : {utilisateur.email}
            </p>

            <h2>Créer un compte bancaire</h2>

            <form onSubmit={gererCreationCompte}>
              <label htmlFor="nomCompte">
                Nom du compte
              </label>

              <input
                id="nomCompte"
                type="text"
                value={nomCompte}
                onChange={(event) =>
                  setNomCompte(event.target.value)
                }
                required
              />

              <label htmlFor="typeCompte">
                Type du compte
              </label>

              <input
                id="typeCompte"
                type="text"
                value={typeCompte}
                onChange={(event) =>
                  setTypeCompte(event.target.value)
                }
                required
              />

              <button type="submit">
                Ajouter le compte
              </button>
            </form>

            <h2>Mes comptes</h2>

            {comptes.length === 0 ? (
              <p>
                Aucun compte bancaire enregistré.
              </p>
            ) : (
              <ul>
                {comptes.map((compte) => (
                  <li key={compte.id}>
                    {compte.nom}
                    {" — "}
                    {compte.solde_initial}
                    {" "}
                    {compte.devise}

                    <button
                      type="button"
                      onClick={() =>
                        demarrerModification(
                          compte
                        )
                      }
                    >
                      Modifier
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        gererSuppressionCompte(
                          compte.id
                        )
                      }
                    >
                      Supprimer
                    </button>

                    {/* 🟨 NOUVEAU : formulaire prérempli */}
                    {compteEnModification ===
                      compte.id && (
                      <form
                        onSubmit={
                          gererModificationCompte
                        }
                      >
                        <label htmlFor="nomCompteModifie">
                          Nom
                        </label>

                        <input
                          id="nomCompteModifie"
                          type="text"
                          value={nomCompteModifie}
                          onChange={(event) =>
                            setNomCompteModifie(
                              event.target.value
                            )
                          }
                          required
                        />

                        <label htmlFor="typeCompteModifie">
                          Type
                        </label>

                        <input
                          id="typeCompteModifie"
                          type="text"
                          value={typeCompteModifie}
                          onChange={(event) =>
                            setTypeCompteModifie(
                              event.target.value
                            )
                          }
                          required
                        />

                        <label htmlFor="soldeCompteModifie">
                          Solde initial
                        </label>

                        <input
                          id="soldeCompteModifie"
                          type="number"
                          step="0.01"
                          value={soldeCompteModifie}
                          onChange={(event) =>
                            setSoldeCompteModifie(
                              event.target.value
                            )
                          }
                          required
                        />

                        <label htmlFor="deviseCompteModifie">
                          Devise
                        </label>

                        <input
                          id="deviseCompteModifie"
                          type="text"
                          value={deviseCompteModifie}
                          onChange={(event) =>
                            setDeviseCompteModifie(
                              event.target.value
                            )
                          }
                          required
                        />

                        <button type="submit">
                          Enregistrer
                        </button>

                        <button
                          type="button"
                          onClick={
                            annulerModification
                          }
                        >
                          Annuler
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={gererDeconnexion}
            >
              Se déconnecter
            </button>
          </div>
        )}
      </section>
    </main>
  )
}

export default App