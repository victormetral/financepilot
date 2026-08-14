// ============================================================
// FORMULAIRE DES RÉCURRENCES
// ============================================================
//
// Rôle : saisir ou modifier un modèle de transaction
// récurrente.
//
// Un seul composant pour les deux usages, contrairement aux
// transactions : avec dix champs, deux fichiers quasi
// identiques finiraient par diverger au premier changement.
// La présence de la prop `recurrence` bascule en modification.
//
// Les champs sont initialisés directement depuis la prop,
// sans useEffect de synchronisation. PageRecurrences.jsx pose
// une `key` liée à l'identifiant : au changement de
// récurrence, React remonte le composant, qui repart donc des
// bonnes valeurs. C'est la méthode recommandée par React pour
// réinitialiser un formulaire, et elle évite la cascade de
// rendus que provoquerait un effet appelant dix setState.
//
// Utilisé par : pages/PageRecurrences.jsx
// Utilise : constants/recurrence.constants.js

import { useState } from "react"

import {
  FREQUENCES,
  INTERVALLE_MINIMUM,
  INTERVALLE_MAXIMUM,
} from "../constants/recurrence.constants.js"

// Date du jour en AAAA-MM-JJ, valeur par défaut de date_debut.
function dateDuJour() {
  const maintenant = new Date()

  return [
    maintenant.getFullYear(),
    String(maintenant.getMonth() + 1).padStart(2, "0"),
    String(maintenant.getDate()).padStart(2, "0"),
  ].join("-")
}

function RecurrenceForm({
  comptes,
  categories,
  recurrence,
  onCreation,
  onModification,
  onAnnulation,
}) {
  const enModification = Boolean(recurrence)

  /*
    Les dates arrivent en "AAAA-MM-JJ" depuis le backend
    (parseur de type DATE dans config/database.js) : elles
    sont directement utilisables par un input type=date.
  */
  const [compteId, setCompteId] = useState(
    recurrence ? String(recurrence.compte_id) : ""
  )
  const [categorieId, setCategorieId] = useState(
    recurrence?.categorie_id ? String(recurrence.categorie_id) : ""
  )
  const [libelle, setLibelle] = useState(recurrence?.libelle ?? "")
  const [montant, setMontant] = useState(recurrence?.montant ?? "")
  const [typeTransaction, setTypeTransaction] = useState(
    recurrence?.type_transaction ?? "depense"
  )
  const [frequence, setFrequence] = useState(
    recurrence?.frequence ?? "mensuelle"
  )
  const [intervalle, setIntervalle] = useState(recurrence?.intervalle ?? 1)
  const [dateDebut, setDateDebut] = useState(
    recurrence?.date_debut ?? dateDuJour()
  )
  const [dateFin, setDateFin] = useState(recurrence?.date_fin ?? "")
  const [active, setActive] = useState(recurrence?.active ?? true)

  function reinitialiser() {
    setCompteId("")
    setCategorieId("")
    setLibelle("")
    setMontant("")
    setTypeTransaction("depense")
    setFrequence("mensuelle")
    setIntervalle(1)
    setDateDebut(dateDuJour())
    setDateFin("")
    setActive(true)
  }

  async function gererEnvoi(evenement) {
    evenement.preventDefault()

    const donnees = {
      compteId,
      categorieId,
      libelle,
      montant,
      typeTransaction,
      frequence,
      intervalle,
      dateDebut,
      dateFin,
      active,
    }

    if (enModification) {
      await onModification(recurrence.id, donnees)
      return
    }

    // Le formulaire ne se vide qu'en cas de succès : sinon la
    // saisie serait perdue à cause d'une simple erreur de champ.
    const reussi = await onCreation(donnees)

    if (reussi) {
      reinitialiser()
    }
  }

  if (comptes.length === 0) {
    return (
      <p className="page__note">
        Créez d'abord un compte pour pouvoir programmer une récurrence.
      </p>
    )
  }

  return (
    <form onSubmit={gererEnvoi} className="formulaire">
      <div className="formulaire__champ">
        <label htmlFor="compteRecurrence">Compte</label>
        <select
          id="compteRecurrence"
          value={compteId}
          onChange={(event) => setCompteId(event.target.value)}
          required
        >
          <option value="">Choisir un compte</option>
          {comptes.map((compte) => (
            <option key={compte.id} value={compte.id}>
              {compte.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="categorieRecurrence">Catégorie (facultatif)</label>
        <select
          id="categorieRecurrence"
          value={categorieId}
          onChange={(event) => setCategorieId(event.target.value)}
        >
          <option value="">Aucune catégorie</option>
          {categories.map((categorie) => (
            <option key={categorie.id} value={categorie.id}>
              {categorie.nom}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="libelleRecurrence">Libellé</label>
        <input
          id="libelleRecurrence"
          type="text"
          placeholder="Loyer, Salaire, Abonnement…"
          value={libelle}
          onChange={(event) => setLibelle(event.target.value)}
          required
        />
      </div>

      <div className="formulaire__champ">
        <label htmlFor="montantRecurrence">Montant (€)</label>
        <input
          id="montantRecurrence"
          type="number"
          step="0.01"
          placeholder="-750.00"
          value={montant}
          onChange={(event) => setMontant(event.target.value)}
          required
        />
        <span className="formulaire__aide">
          Négatif pour une dépense, positif pour un revenu.
        </span>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="typeRecurrence">Type</label>
        <select
          id="typeRecurrence"
          value={typeTransaction}
          onChange={(event) => setTypeTransaction(event.target.value)}
          required
        >
          <option value="depense">Dépense</option>
          <option value="revenu">Revenu</option>
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="frequenceRecurrence">Fréquence</label>
        <select
          id="frequenceRecurrence"
          value={frequence}
          onChange={(event) => setFrequence(event.target.value)}
          required
        >
          {FREQUENCES.map((option) => (
            <option key={option.valeur} value={option.valeur}>
              {option.libelle}
            </option>
          ))}
        </select>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="intervalleRecurrence">Répéter toutes les…</label>
        <input
          id="intervalleRecurrence"
          type="number"
          min={INTERVALLE_MINIMUM}
          max={INTERVALLE_MAXIMUM}
          step="1"
          value={intervalle}
          onChange={(event) => setIntervalle(event.target.value)}
          required
        />
        <span className="formulaire__aide">
          1 pour chaque fois, 2 pour une fois sur deux, etc.
        </span>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="dateDebutRecurrence">Première échéance</label>
        <input
          id="dateDebutRecurrence"
          type="date"
          value={dateDebut}
          onChange={(event) => setDateDebut(event.target.value)}
          required
        />
        <span className="formulaire__aide">
          Une date passée génère aussitôt les échéances manquées.
        </span>
      </div>

      <div className="formulaire__champ">
        <label htmlFor="dateFinRecurrence">Dernière échéance (facultatif)</label>
        <input
          id="dateFinRecurrence"
          type="date"
          value={dateFin}
          min={dateDebut}
          onChange={(event) => setDateFin(event.target.value)}
        />
        <span className="formulaire__aide">
          Laisser vide pour une récurrence sans fin.
        </span>
      </div>

      {enModification && (
        <div className="formulaire__champ formulaire__champ--interrupteur">
          <label htmlFor="activeRecurrence">
            <input
              id="activeRecurrence"
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
            />
            Récurrence active
          </label>
        </div>
      )}

      {enModification ? (
        <div style={{ display: "flex", gap: "var(--espace-2)" }}>
          <button type="submit" className="formulaire__bouton">
            Enregistrer
          </button>
          <button
            type="button"
            className="bouton-secondaire"
            onClick={onAnnulation}
          >
            Annuler
          </button>
        </div>
      ) : (
        <button type="submit" className="formulaire__bouton">
          Programmer la récurrence
        </button>
      )}
    </form>
  )
}

export default RecurrenceForm