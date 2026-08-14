// ============================================================
// HOOK D'ACCÈS AUX RÉGLAGES
// ============================================================
//
// Rôle : raccourci de lecture du contexte de réglages, avec
// garde-fou si utilisé hors du ReglagesProvider.
//
// Utilisé par : TransactionList.jsx, PageReglages.jsx
// Utilise : contexts/reglagesContextInstance.js

import { useContext } from "react"

import { ReglagesContext } from "../contexts/reglagesContextInstance.js"

export function useReglages() {
  const contexte = useContext(ReglagesContext)

  if (!contexte) {
    throw new Error("useReglages doit être utilisé dans un ReglagesProvider")
  }

  return contexte
}