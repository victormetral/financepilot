BEGIN;

-- Ajoute le sous-type précis du produit financier.
ALTER TABLE compte
ADD COLUMN sous_type_compte VARCHAR(50);

-- Corrige l'ancien type "livret" et complète les comptes existants.
UPDATE compte
SET
  type_compte = CASE
    WHEN type_compte = 'livret' THEN 'epargne'
    ELSE type_compte
  END,
  sous_type_compte = CASE
    WHEN type_compte = 'livret' THEN 'livret_a'
    WHEN type_compte = 'courant' THEN 'compte_courant'
    WHEN type_compte = 'epargne' THEN 'autre_epargne'
    WHEN type_compte = 'investissement' AND LOWER(nom) = 'pea' THEN 'pea'
    WHEN type_compte = 'investissement' THEN 'autre_investissement'
  END;

-- Empêche les familles de comptes inconnues.
ALTER TABLE compte
ADD CONSTRAINT compte_type_compte_valide
CHECK (
  type_compte IN (
    'courant',
    'epargne',
    'investissement',
    'credit',
    'pret'
  )
);

-- Empêche les combinaisons type / sous-type incohérentes.
ALTER TABLE compte
ADD CONSTRAINT compte_type_et_sous_type_coherents
CHECK (
  sous_type_compte IS NULL
  OR (type_compte = 'courant' AND sous_type_compte = 'compte_courant')
  OR (
    type_compte = 'epargne'
    AND sous_type_compte IN (
      'livret_a',
      'ldds',
      'lep',
      'pel',
      'cel',
      'autre_epargne'
    )
  )
  OR (
    type_compte = 'investissement'
    AND sous_type_compte IN (
      'pea',
      'assurance_vie',
      'cto',
      'crypto',
      'autre_investissement'
    )
  )
  OR (type_compte = 'credit' AND sous_type_compte = 'carte_credit')
  OR (
    type_compte = 'pret'
    AND sous_type_compte IN (
      'pret_immobilier',
      'pret_consommation',
      'autre_pret'
    )
  )
);

COMMIT;