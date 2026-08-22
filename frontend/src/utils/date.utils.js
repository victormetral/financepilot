// ============================================================
// OUTILS DE DATE
// ============================================================
//
// Rôle : manipuler les dates de transaction sans jamais
// tomber dans les pièges de fuseau horaire.
//
// Utilisé par : patrimoine.utils.js, budget.utils.js
// Utilise : rien

/*
  Ne garde que la partie date d'une valeur.

  Depuis le correctif du Lot 9d (setTypeParser dans
  config/database.js), PostgreSQL renvoie déjà "2026-08-31".
  La fonction reste utile pour les données antérieures et pour
  toute valeur qui arriverait au format ISO complet : le split
  ne trouve alors rien à couper et renvoie la chaîne telle
  quelle.
*/
export function extraireDate(dateIso) {
  return String(dateIso).split("T")[0]
}

export function estDansLeMois(dateIso, mois, annee) {
  const [anneeTransaction, moisTransaction] = extraireDate(dateIso).split("-")

  return Number(anneeTransaction) === annee && Number(moisTransaction) === mois
}

export function joursDansLeMois(mois, annee) {
  // Le jour 0 du mois suivant est le dernier jour du mois courant.
  return new Date(annee, mois, 0).getDate()
}

export function joursRestantsDansLeMois(dateReference = new Date()) {
  const mois = dateReference.getMonth() + 1
  const annee = dateReference.getFullYear()

  return joursDansLeMois(mois, annee) - dateReference.getDate() + 1
}