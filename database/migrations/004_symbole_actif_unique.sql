-- ============================================================
-- MIGRATION 004 — UNICITÉ DU SYMBOLE D'ACTIF
-- ============================================================
--
-- Rôle : remplacer la contrainte UNIQUE (symbole, devise) par
-- une contrainte sur symbole seul.
--
-- Justification : le symbole identifie une cotation précise, pas
-- un titre sous-jacent. Un ETF World coté à Paris (CW8) et à
-- Amsterdam (IWDA) a deux symboles distincts — il n'existe donc
-- pas de cas légitime où le même symbole porte deux devises.
--
-- L'ancienne contrainte laissait passer des doublons absurdes :
-- "CW8 · ETF · EUR" et "CW8 · Immobilier · CAD" coexistaient.
--
-- Appliqué par : .github/workflows/ci.yml et manuellement en local

ALTER TABLE actif_financier
  DROP CONSTRAINT IF EXISTS actif_financier_symbole_devise_key;

ALTER TABLE actif_financier
  ADD CONSTRAINT actif_financier_symbole_unique UNIQUE (symbole);