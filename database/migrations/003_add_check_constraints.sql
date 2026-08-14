-- ============================================================
-- MIGRATION 003 — CONTRAINTES DE VALIDATION EN BASE
-- ============================================================
--
-- Rôle : ajouter des contraintes CHECK sur les colonnes dont
-- les valeurs sont censées appartenir à une liste fermée.
--
-- Pourquoi c'est nécessaire alors que le backend valide déjà :
-- le validator protège les requêtes qui passent par l'API, mais
-- pas un script de migration bugué, un import CSV, ni un psql
-- manuel. La base est le dernier rempart : une donnée invalide
-- qui s'y installe corrompt tous les calculs en aval.
--
-- Ces listes doivent rester alignées avec :
-- - backend/src/constants/*.constants.js
-- - frontend/src/constants/*.constants.js
--
-- Appliqué par : .github/workflows/ci.yml et manuellement en local

-- ------------------------------------------------------------
-- 1. DEVISES
-- ------------------------------------------------------------

ALTER TABLE compte
  ADD CONSTRAINT compte_devise_valide
  CHECK (devise IN ('EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'));

ALTER TABLE actif_financier
  ADD CONSTRAINT actif_financier_devise_valide
  CHECK (devise IN ('EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD'));

-- ------------------------------------------------------------
-- 2. TYPES DE COMPTE
-- ------------------------------------------------------------

ALTER TABLE compte
  ADD CONSTRAINT compte_type_valide
  CHECK (type_compte IN ('courant', 'epargne', 'investissement', 'credit', 'pret'));

-- ------------------------------------------------------------
-- 3. TYPES DE CATÉGORIE ET DE TRANSACTION
-- ------------------------------------------------------------

ALTER TABLE categorie
  ADD CONSTRAINT categorie_type_valide
  CHECK (type_categorie IN ('depense', 'revenu'));

ALTER TABLE transaction_financiere
  ADD CONSTRAINT transaction_type_valide
  CHECK (type_transaction IN ('depense', 'revenu', 'transfert'));

-- ------------------------------------------------------------
-- 4. TYPES D'ACTIF ET D'OPÉRATION
-- ------------------------------------------------------------

ALTER TABLE actif_financier
  ADD CONSTRAINT actif_financier_type_valide
  CHECK (type_actif IN ('action', 'etf', 'crypto', 'obligation', 'fonds', 'immobilier', 'autre'));

ALTER TABLE operation_investissement
  ADD CONSTRAINT operation_type_valide
  CHECK (type_operation IN ('achat', 'vente'));

-- ------------------------------------------------------------
-- 5. COHÉRENCE DES MONTANTS
-- ------------------------------------------------------------
-- Un budget ou un objectif à 0 € n'a pas de sens ;
-- une quantité d'actif négative non plus.

ALTER TABLE budget
  ADD CONSTRAINT budget_montant_positif
  CHECK (montant_limite > 0);

ALTER TABLE budget
  ADD CONSTRAINT budget_mois_valide
  CHECK (mois BETWEEN 1 AND 12);

ALTER TABLE objectif
  ADD CONSTRAINT objectif_montant_cible_positif
  CHECK (montant_cible > 0);

ALTER TABLE operation_investissement
  ADD CONSTRAINT operation_quantite_positive
  CHECK (quantite > 0);

ALTER TABLE operation_investissement
  ADD CONSTRAINT operation_prix_positif
  CHECK (prix_unitaire >= 0);