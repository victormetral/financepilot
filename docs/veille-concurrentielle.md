# Veille concurrentielle — FinancePilot

<!--
  RÔLE DE CE FICHIER

  Espace de veille sur les applications de gestion financière
  personnelle qui servent de référence à FinancePilot.

  Utilisé pour :
  - prioriser les lots de la feuille de route ;
  - documenter les choix produit (utile en entretien) ;
  - suivre les évolutions du marché dans le temps.

  Rythme : 20 minutes toutes les deux semaines.
  À chaque session de veille : scanner les sources (section 5),
  puis ajouter 2-3 lignes datées dans le journal (section 6).
-->

---

## 1. Paysage du marché (état août 2026)

Depuis la fermeture de Mint, deux apps premium dominent le marché
américain : **Copilot Money** et **Monarch Money**. En France, les
références sont **Finary**, **Bankin'** et **Linxo** pour
l'agrégation bancaire, et **YNAB** pour la méthode budgétaire
stricte.

Le marché a fortement progressé : environ 78 % des Français
utilisent au moins une app de gestion financière en 2026,
contre 34 % en 2023.

Deux tendances de fond :

- **IA partout** : catégorisation automatique par apprentissage,
  assistants conversationnels intégrés (Bankin' depuis 2025).
- **Contre-courant privacy** : des apps sans agrégateur bancaire,
  où les données ne quittent pas l'appareil. FinancePilot est
  déjà dans ce camp par construction (pas d'agrégateur, pas de
  Plaid, données chez l'utilisateur).

---

## 2. Fiches par application

### Copilot Money

- **Positionnement** : l'app « qui fait du bien à ouvrir ».
  Design soigné, écosystème Apple uniquement.
- **Prix** : ~13 $/mois.
- **Forces** : design, catégorisation IA, intégration Apple.
- **Leçon pour FinancePilot** : le design EST le produit.
  Les gens paient pour la beauté.
- **Sources de veille** : notes de version App Store, compte X.

### Monarch Money

- **Positionnement** : construit pour les foyers — plusieurs
  utilisateurs, un même tableau partagé.
- **Prix** : ~15 $/mois.
- **Forces** : collaboration multi-utilisateurs.
- **Leçon pour FinancePilot** : la collaboration est un
  différenciateur massif (piste post-Lot 12).
- **Sources de veille** : monarchmoney.com/blog, r/MonarchMoney.

### YNAB (You Need A Budget)

- **Positionnement** : méthode stricte de zéro-based budgeting
  qui force le changement de comportement.
- **Prix** : ~14 $/mois.
- **Forces** : une philosophie claire, communauté très engagée.
- **Leçon pour FinancePilot** : une *philosophie* vaut plus
  qu'une liste de features.
- **Sources de veille** : ynab.com/blog, r/ynab.

### Finary

- **Positionnement** : centralise tout le patrimoine — comptes,
  PEA, assurance-vie, immobilier, crypto — et relie dépenses et
  investissements. **Concurrent direct de FinancePilot sur le
  positionnement.**
- **Prix** : freemium.
- **Forces** : vision patrimoniale unifiée, très bon produit
  français.
- **Leçon pour FinancePilot** : c'est le modèle à observer en
  priorité.
- **Sources de veille** : finary.com/blog, r/vosfinances.

### Bankin'

- **Positionnement** : la référence des débutants en France.
  Interface intuitive, alertes de découvert, assistant
  conversationnel IA depuis 2025.
- **Prix** : freemium.
- **Forces** : simplicité d'entrée, adoption massive.
- **Leçon pour FinancePilot** : la simplicité d'entrée décide
  de l'adoption (justifie le mode Simple/Avancé du Lot 11).
- **Sources de veille** : blog.bankin.com.

### Linxo

- **Positionnement** : agrégation bancaire française historique,
  rachetée par le Crédit Agricole.
- **Prix** : freemium.
- **Forces** : fiabilité de l'agrégation.
- **Leçon pour FinancePilot** : suivi secondaire — moins
  innovant que les cinq autres.

---

## 3. Tableau comparatif

| App | Force principale | Prix | Leçon retenue |
|---|---|---|---|
| Copilot | Design, catégorisation IA | ~13 $/mois | Le design est le produit |
| Monarch | Multi-utilisateurs / foyers | ~15 $/mois | La collaboration différencie |
| YNAB | Méthode zéro-based | ~14 $/mois | Une philosophie > des features |
| Finary | Patrimoine unifié | Freemium | Concurrent direct, à observer |
| Bankin' | Simplicité débutants | Freemium | La simplicité décide de l'adoption |
| Linxo | Agrégation fiable | Freemium | Suivi secondaire |

---

## 4. Position de FinancePilot

### Ce que FinancePilot a et que peu ont

- Budget + investissements unifiés avec PRU fiscal correct.
- Coût d'opportunité paramétrable — personne ne l'a.
- Rythme de dépense (consommé vs théorique à date) — rare.
- Projection d'objectifs basée sur l'épargne réelle — rare.
- Privacy par construction : pas d'agrégateur, données chez
  l'utilisateur.
- Thème clair/sombre, validation à 3 niveaux, architecture saine.

### Ce qui manque face au marché (traduit en feuille de route)

| Manque | Réponse prévue |
|---|---|
| Saisie rapide (6 champs = friction mortelle) | Lot 9 — saisie express, récurrentes, duplication |
| Dimension temporelle (historique, évolution) | Lot 10 — courbe de patrimoine, sélecteur de mois |
| Identité / philosophie visible | Lot 11 — coût d'opportunité agrégé, mode Simple/Avancé, score de santé |
| Mobile | Lot 12 — responsive |

---

## 5. Sources de veille (dossier Feedly « Finance apps »)

| Type | Sources |
|---|---|
| Blogs officiels | monarchmoney.com/blog, ynab.com/blog, finary.com/blog, blog.bankin.com |
| Notes de version | Fiches App Store des 6 apps (section « Nouveautés »), 1×/mois |
| Lancements | Pages Product Hunt des apps |
| Voix des utilisateurs | r/ynab, r/MonarchMoney, r/vosfinances |
| Réseaux | Compte X de Copilot (seul canal actif de l'app) |

---

## 6. Journal de veille

<!--
  Format : date — app — observation — impact éventuel sur
  FinancePilot. 2-3 lignes maximum par entrée.
-->

- **2026-08-14** — Initialisation du fichier à partir de
  l'analyse comparative menée en session (recherches web du
  14/08/2026). Feuille de route Lots 9-12 validée en réponse
  aux manques identifiés.
