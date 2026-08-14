// ============================================================
// FOURNISSEUR DE RÉGLAGES UTILISATEUR
// ============================================================
//
// Rôle : mémoriser les préférences d'affichage du coût
// d'opportunité — activation, taux de rendement, horizon.
//
// Stocké dans localStorage : ce sont des préférences d'affichage,
// pas des données métier. Elles n'ont pas besoin d'être partagées
// entre appareils ni protégées côté serveur, contrairement au JWT.
//
// Utilisé par : main.jsx
// Utilise : contexts/reglagesContextInstance.js

import { useEffect, useState } from "react"

import { ReglagesContext } from "./reglagesContextInstance.js"

const CLE_STOCKAGE = "financepilot-reglages"

// 7 % nominal sur 20 ans : rendement long terme défendable pour
// un ETF Monde. Le rendement réel (après inflation) tourne
// plutôt autour de 5 % — d'où la possibilité de l'ajuster.
const REGLAGES_PAR_DEFAUT = {
  coutOpportuniteActif: true,
  tauxRendement: 7,
  horizonAnnees: 20,
}

function lireReglagesInitiaux() {
  try {
    const reglagesEnregistres = localStorage.getItem(CLE_STOCKAGE)

    if (!reglagesEnregistres) {
      return REGLAGES_PAR_DEFAUT
    }

    // Fusion avec les valeurs par défaut : si un nouveau réglage
    // est ajouté plus tard, les anciens enregistrements restent
    // valides sans migration.
    return { ...REGLAGES_PAR_DEFAUT, ...JSON.parse(reglagesEnregistres) }
  } catch {
    return REGLAGES_PAR_DEFAUT
  }
}

export function ReglagesProvider({ children }) {
  const [reglages, setReglages] = useState(lireReglagesInitiaux)

  useEffect(() => {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(reglages))
  }, [reglages])

  function modifierReglage(nom, valeur) {
    setReglages((reglagesActuels) => ({ ...reglagesActuels, [nom]: valeur }))
  }

  return (
    <ReglagesContext.Provider value={{ reglages, modifierReglage }}>
      {children}
    </ReglagesContext.Provider>
  )
}