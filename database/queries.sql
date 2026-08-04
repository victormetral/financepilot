-- Requête 1 :
-- Afficher les comptes avec leur propriétaire.

SELECT
  utilisateur.nom,
  utilisateur.prenom,
  compte.nom AS nom_compte,
  compte.type_compte,
  compte.solde_initial,
  compte.devise
FROM compte
JOIN utilisateur
  ON compte.utilisateur_id = utilisateur.id
ORDER BY
  utilisateur.nom ASC,
  compte.nom ASC;

  -- Requête 2 :
-- Calculer le solde actuel de chaque compte.

SELECT
  compte.nom AS nom_compte,
  utilisateur.nom,
  utilisateur.prenom,
  compte.solde_initial,
  COALESCE(
    SUM(transaction_financiere.montant),
    0
  ) AS total_transactions,
  compte.solde_initial
    + COALESCE(
        SUM(transaction_financiere.montant),
        0
      ) AS solde_actuel,
  compte.devise
FROM compte
JOIN utilisateur
  ON compte.utilisateur_id = utilisateur.id
LEFT JOIN transaction_financiere
  ON transaction_financiere.compte_id = compte.id
GROUP BY
  compte.id,
  compte.nom,
  utilisateur.nom,
  utilisateur.prenom,
  compte.solde_initial,
  compte.devise
ORDER BY
  utilisateur.nom ASC,
  compte.nom ASC;

  -- Requête 3 :
-- Afficher les dépenses par catégorie et par utilisateur.

SELECT
  utilisateur.nom,
  utilisateur.prenom,
  categorie.nom AS categorie,
  ABS(
    SUM(transaction_financiere.montant)
  ) AS total_depenses
FROM transaction_financiere
JOIN compte
  ON transaction_financiere.compte_id = compte.id
JOIN utilisateur
  ON compte.utilisateur_id = utilisateur.id
JOIN categorie
  ON transaction_financiere.categorie_id = categorie.id
WHERE transaction_financiere.montant < 0
GROUP BY
  utilisateur.id,
  utilisateur.nom,
  utilisateur.prenom,
  categorie.id,
  categorie.nom
ORDER BY
  utilisateur.nom ASC,
  total_depenses DESC;

  -- Requête 4 :
-- Comparer les dépenses réelles aux budgets mensuels.

SELECT
  utilisateur.nom,
  utilisateur.prenom,
  categorie.nom AS categorie,
  budget.montant_limite,
  ABS(
    COALESCE(
      SUM(transaction_financiere.montant),
      0
    )
  ) AS total_depenses,
  budget.montant_limite
    - ABS(
        COALESCE(
          SUM(transaction_financiere.montant),
          0
        )
      ) AS budget_restant
FROM budget
JOIN utilisateur
  ON budget.utilisateur_id = utilisateur.id
JOIN categorie
  ON budget.categorie_id = categorie.id
LEFT JOIN compte
  ON compte.utilisateur_id = utilisateur.id
LEFT JOIN transaction_financiere
  ON transaction_financiere.compte_id = compte.id
  AND transaction_financiere.categorie_id = categorie.id
  AND EXTRACT(MONTH FROM transaction_financiere.date_transaction) = budget.mois
  AND EXTRACT(YEAR FROM transaction_financiere.date_transaction) = budget.annee
GROUP BY
  budget.id,
  utilisateur.nom,
  utilisateur.prenom,
  categorie.nom,
  budget.montant_limite
ORDER BY
  utilisateur.nom ASC,
  categorie.nom ASC;

  -- Requête 5 :
-- Afficher la progression de chaque objectif financier.

SELECT
  utilisateur.nom,
  utilisateur.prenom,
  objectif.nom AS objectif,
  objectif.montant_cible,
  objectif.montant_actuel,
  ROUND(
    objectif.montant_actuel
    / objectif.montant_cible
    * 100,
    2
  ) AS progression_pourcentage,
  objectif.date_echeance,
  objectif.statut
FROM objectif
JOIN utilisateur
  ON objectif.utilisateur_id = utilisateur.id
ORDER BY
  utilisateur.nom ASC,
  progression_pourcentage DESC;

  -- Requête 6 :
-- Afficher le montant total investi par actif financier.

SELECT
  actif_financier.symbole,
  actif_financier.nom,
  actif_financier.type_actif,
  SUM(
    operation_investissement.quantite
    * operation_investissement.prix_unitaire
    + operation_investissement.frais
  ) AS montant_total_investi,
  actif_financier.devise
FROM operation_investissement
JOIN actif_financier
  ON operation_investissement.actif_financier_id = actif_financier.id
WHERE operation_investissement.type_operation = 'achat'
GROUP BY
  actif_financier.id,
  actif_financier.symbole,
  actif_financier.nom,
  actif_financier.type_actif,
  actif_financier.devise
ORDER BY montant_total_investi DESC;

-- Requête 7 :
-- Calculer la quantité actuellement détenue pour chaque actif.

SELECT
  actif_financier.symbole,
  actif_financier.nom,
  SUM(
    CASE
      WHEN operation_investissement.type_operation = 'achat'
        THEN operation_investissement.quantite
      WHEN operation_investissement.type_operation = 'vente'
        THEN -operation_investissement.quantite
      ELSE 0
    END
  ) AS quantite_detenue
FROM operation_investissement
JOIN actif_financier
  ON operation_investissement.actif_financier_id = actif_financier.id
GROUP BY
  actif_financier.id,
  actif_financier.symbole,
  actif_financier.nom
ORDER BY quantite_detenue DESC;

-- Requête 8 :
-- Calculer la répartition du portefeuille par actif.

WITH valeur_par_actif AS (
  SELECT
    actif_financier.id,
    actif_financier.symbole,
    actif_financier.nom,
    SUM(
      CASE
        WHEN operation_investissement.type_operation = 'achat'
          THEN operation_investissement.quantite
               * operation_investissement.prix_unitaire
        WHEN operation_investissement.type_operation = 'vente'
          THEN -operation_investissement.quantite
               * operation_investissement.prix_unitaire
        ELSE 0
      END
    ) AS valeur_investie
  FROM operation_investissement
  JOIN actif_financier
    ON operation_investissement.actif_financier_id = actif_financier.id
  GROUP BY
    actif_financier.id,
    actif_financier.symbole,
    actif_financier.nom
)

SELECT
  symbole,
  nom,
  valeur_investie,
  ROUND(
    valeur_investie
    / SUM(valeur_investie) OVER ()
    * 100,
    2
  ) AS repartition_pourcentage
FROM valeur_par_actif
ORDER BY repartition_pourcentage DESC;