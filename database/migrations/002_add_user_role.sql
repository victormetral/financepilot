/*
  MIGRATION 002 : rôle utilisateur

  Rôle général :
  ajoute une notion de rôle à la table utilisateur,
  pour distinguer un utilisateur normal d'un
  administrateur.

  Utilisé par :
  - auth.controller.js (inclut le rôle dans le JWT)
  - auth.middleware.js (vérifie le rôle sur les routes
    réservées aux administrateurs)

  Décision produit :
  actif_financier est un référentiel partagé entre
  tous les utilisateurs. Seul un administrateur peut
  le modifier (POST/PUT/DELETE), pour éviter qu'un
  utilisateur casse les données d'un autre.
*/

BEGIN;

-- Ajoute la colonne role, "utilisateur" par défaut.
ALTER TABLE utilisateur
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'utilisateur';

-- Empêche toute valeur de rôle inconnue.
ALTER TABLE utilisateur
ADD CONSTRAINT utilisateur_role_valide
CHECK (
  role IN ('utilisateur', 'administrateur')
);

COMMIT;