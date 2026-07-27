INSERT INTO utilisateur (
  nom,
  prenom,
  email,
  mot_de_passe
) VALUES
  ('Martin', 'Alice', 'alice.martin@demo.fr', 'hash_demo_alice'),
  ('Durand', 'Thomas', 'thomas.durand@demo.fr', 'hash_demo_thomas'),
  ('Bernard', 'Sofia', 'sofia.bernard@demo.fr', 'hash_demo_sofia');

  INSERT INTO compte (
  utilisateur_id,
  nom,
  type_compte,
  solde_initial,
  devise
) VALUES
  (1, 'Compte courant', 'courant', 1850.00, 'EUR'),
  (1, 'Livret', 'epargne', 6200.00, 'EUR'),
  (1, 'PEA', 'investissement', 11000.00, 'EUR'),
  (2, 'Compte courant', 'courant', 2400.00, 'EUR'),
  (2, 'Compte Canada', 'courant', 3500.00, 'CAD'),
  (3, 'Compte courant', 'courant', 1950.00, 'EUR');

  INSERT INTO categorie (
  utilisateur_id,
  nom,
  type_categorie
) VALUES
  (1, 'Salaire', 'revenu'),
  (1, 'Logement', 'depense'),
  (1, 'Alimentation', 'depense'),
  (1, 'Transport', 'depense'),
  (1, 'Loisirs', 'depense'),
  (1, 'Investissement', 'depense'),

  (2, 'Salaire', 'revenu'),
  (2, 'Logement', 'depense'),
  (2, 'Alimentation', 'depense'),

  (3, 'Salaire', 'revenu'),
  (3, 'Logement', 'depense'),
  (3, 'Alimentation', 'depense');

  INSERT INTO transaction_financiere (
  compte_id,
  categorie_id,
  libelle,
  montant,
  date_transaction,
  type_transaction
) VALUES
  (1, 1, 'Salaire juillet', 2100.00, '2026-07-01', 'revenu'),
  (1, 2, 'Loyer appartement', -750.00, '2026-07-03', 'depense'),
  (1, 3, 'Courses Auchan', -82.50, '2026-07-05', 'depense'),
  (1, 4, 'Abonnement transport', -69.40, '2026-07-06', 'depense'),
  (1, 5, 'Cinéma', -14.50, '2026-07-10', 'depense'),
  (1, 6, 'Versement vers PEA', -200.00, '2026-07-12', 'transfert'),

  (4, 7, 'Salaire juillet', 2400.00, '2026-07-01', 'revenu'),
  (4, 8, 'Loyer appartement', -900.00, '2026-07-04', 'depense'),
  (4, 9, 'Courses alimentaires', -110.25, '2026-07-08', 'depense'),

  (6, 10, 'Salaire juillet', 1950.00, '2026-07-01', 'revenu'),
  (6, 11, 'Loyer appartement', -700.00, '2026-07-03', 'depense'),
  (6, 12, 'Courses alimentaires', -96.80, '2026-07-09', 'depense');

  INSERT INTO budget (
  utilisateur_id,
  categorie_id,
  montant_maximum,
  mois,
  annee
) VALUES
  (1, 3, 300.00, 7, 2026),
  (1, 4, 100.00, 7, 2026),
  (1, 5, 120.00, 7, 2026),

  (2, 9, 350.00, 7, 2026),

  (3, 12, 280.00, 7, 2026);

  INSERT INTO objectif (
  utilisateur_id,
  nom,
  montant_cible,
  montant_actuel,
  date_echeance,
  statut
) VALUES
  (1, 'Épargne de sécurité', 10000.00, 6200.00, '2027-06-30', 'en_cours'),
  (1, 'Projet Canada', 20000.00, 6500.00, '2029-06-01', 'en_cours'),

  (2, 'Apport immobilier', 30000.00, 8500.00, '2030-12-31', 'en_cours'),

  (3, 'Voyage au Japon', 5000.00, 1700.00, '2027-04-01', 'en_cours');

  INSERT INTO actif_financier (
  symbole,
  nom,
  type_actif,
  devise
) VALUES
  ('CW8', 'Amundi MSCI World', 'ETF', 'EUR'),
  ('PUST', 'Amundi PEA Nasdaq-100', 'ETF', 'EUR'),
  ('BTC', 'Bitcoin', 'crypto', 'EUR'),
  ('ETH', 'Ethereum', 'crypto', 'EUR'),
  ('AAPL', 'Apple Inc.', 'action', 'USD');

  INSERT INTO operation_investissement (
  compte_id,
  actif_financier_id,
  type_operation,
  quantite,
  prix_unitaire,
  frais,
  date_operation
) VALUES
  (3, 1, 'achat', 2.00000000, 520.00, 1.00, '2026-07-02'),
  (3, 2, 'achat', 15.00000000, 48.00, 1.00, '2026-07-08'),
  (3, 1, 'achat', 1.00000000, 525.00, 1.00, '2026-07-15'),
  (2, 3, 'achat', 0.00150000, 58000.00, 2.50, '2026-07-18');