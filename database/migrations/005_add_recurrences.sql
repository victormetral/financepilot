-- ============================================================
-- MIGRATION 005 — TRANSACTIONS RÉCURRENTES
-- ============================================================
--
-- Ce fichier crée le modèle de récurrence (« tous les 5 du mois,
-- 750 € de loyer ») et relie les transactions générées au modèle
-- qui les a produites.
--
-- Utilisé par :
-- - recurrence.service.js (lecture / écriture des modèles)
-- - transaction.service.js (affichage du badge « récurrent »)
--
-- Utilise :
-- - les tables compte et categorie (propriété de l'utilisateur)
-- - la table transaction_financiere (occurrences générées)
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. LA TABLE DES MODÈLES
-- ------------------------------------------------------------
--
-- La propriété passe par compte_id, exactement comme pour
-- transaction_financiere : un modèle appartient à l'utilisateur
-- propriétaire de son compte. Aucune colonne utilisateur_id
-- n'est nécessaire, et on évite ainsi qu'elle puisse contredire
-- le propriétaire réel du compte.

CREATE TABLE recurrence (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- Le moule : ces colonnes sont recopiées telles quelles
  -- dans chaque transaction générée.
  compte_id INTEGER NOT NULL REFERENCES compte(id),
  categorie_id INTEGER REFERENCES categorie(id),
  libelle VARCHAR(255) NOT NULL,
  montant NUMERIC(12, 2) NOT NULL,
  type_transaction VARCHAR(20) NOT NULL,

  -- Le rythme.
  frequence VARCHAR(20) NOT NULL,
  intervalle INTEGER NOT NULL DEFAULT 1,
  date_debut DATE NOT NULL,
  date_fin DATE,

  -- Le curseur : date de la prochaine occurrence à créer.
  -- C'est lui qui rend la génération rejouable sans doublon.
  prochaine_occurrence DATE NOT NULL,

  -- Permet de suspendre un modèle sans perdre son historique.
  active BOOLEAN NOT NULL DEFAULT true,

  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- 2. LES GARDE-FOUS
-- ------------------------------------------------------------
--
-- Les CHECK sont là pour que la base refuse d'elle-même une
-- donnée incohérente, même si un bug du backend laisse passer
-- la validation JavaScript. Deuxième filet de sécurité.

-- Les transferts sont exclus tant que compte_destination_id
-- n'existe pas : un transfert a besoin de deux comptes.
ALTER TABLE recurrence
ADD CONSTRAINT recurrence_type_valide
CHECK (type_transaction IN ('revenu', 'depense'));

ALTER TABLE recurrence
ADD CONSTRAINT recurrence_frequence_valide
CHECK (
  frequence IN (
    'hebdomadaire',
    'mensuelle',
    'trimestrielle',
    'annuelle'
  )
);

-- « Toutes les 0 fois » créerait une boucle infinie lors
-- de la génération. Le plafond à 12 évite les saisies absurdes.
ALTER TABLE recurrence
ADD CONSTRAINT recurrence_intervalle_valide
CHECK (intervalle BETWEEN 1 AND 12);

-- Une date de fin antérieure au début rendrait le modèle
-- inutilisable dès sa création.
ALTER TABLE recurrence
ADD CONSTRAINT recurrence_dates_coherentes
CHECK (date_fin IS NULL OR date_fin >= date_debut);

-- ------------------------------------------------------------
-- 3. L'INDEX DE GÉNÉRATION
-- ------------------------------------------------------------
--
-- La requête de rattrapage cherche toujours les modèles actifs
-- dont la prochaine occurrence est déjà passée. L'index évite
-- de parcourir toute la table à chaque connexion.

CREATE INDEX recurrence_a_generer
ON recurrence (prochaine_occurrence)
WHERE active = true;

-- ------------------------------------------------------------
-- 4. LE LIEN VERS LES TRANSACTIONS GÉNÉRÉES
-- ------------------------------------------------------------
--
-- ON DELETE SET NULL est volontaire : supprimer le modèle
-- « Loyer » ne doit jamais effacer les loyers déjà payés.
-- La transaction perd seulement son étiquette d'origine.

ALTER TABLE transaction_financiere
ADD COLUMN recurrence_id INTEGER
REFERENCES recurrence(id) ON DELETE SET NULL;

COMMIT;