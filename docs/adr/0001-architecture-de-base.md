# ADR-001 — Architecture de base de FinancePilot

- **Date** : 12/10/2026, mise à jour le 28/10/2026 (couches du front, pourquoi cette stack)
- **Statut** : proposée
- **Remplace** : la version du 03/10/2026 (cœur hexagonal), archivée dans le document 13c du Drive

## Contexte

Je développe FinancePilot seul, avec 15 à 20 heures par semaine, pour une V1 à livrer avant février 2027. Je débute en TypeScript et en NestJS.

Le livrable du CDA, c'est la V1 : environ 190 points d'effort, dont 92 de « Must » à livrer avant février. C'est un MVP : il doit d'abord être testé par de vrais utilisateurs.

Le titre attend un front et un back séparés, une API documentée et une application organisée en couches.

## Options envisagées

1. **Monolithe classique** : une seule application qui génère aussi les pages. Le plus simple, mais front et back mélangés.
2. **Client-serveur, back en couches** : une SPA, une API, une base. Le standard du marché, et ce que je sais déjà faire.
3. **Client-serveur, back en architecture hexagonale** : même découpage, mais un cœur métier isolé derrière des ports et des adaptateurs. Plus testable, mais pensé pour de gros projets et de grandes équipes.
4. **Microservices** : plusieurs petits back indépendants, avec une API gateway. Fait pour de grandes équipes ; seul, ça mangerait tout mon temps.

Comparaison détaillée : document 13 du Drive, « Comparaison des styles d'architecture ».

## Décision

Je choisis l'option 2 : client-serveur, avec un back en couches.

### Architecture produit — client-serveur

- un front : une SPA, installable sur téléphone (PWA) ;
- une API REST, documentée avec Swagger ;
- une base de données ;
- Stripe, service externe pour les paiements, qui prévient l'API par webhook.

```mermaid
flowchart LR
  FRONT[Front : SPA React, installable en PWA] <-->|HTTP / JSON| API[API : NestJS, modules en couches]
  API <-->|SQL via Prisma| DB[(PostgreSQL)]
  API -->|paiement| STRIPE[Stripe, service externe]
  STRIPE -->|webhook| API
```

### Architecture logicielle

- **Back** : découpé en modules par domaine (auth, comptes, partage, projection, import, abonnement). Dans chaque module, trois couches : contrôleur (reçoit la requête) → service (règles métier) → repository (accès à la base). Chaque couche n'appelle que celle du dessous. Un module ne lit jamais les données d'un autre : il passe par son service.
- **Front** : trois couches, dans un seul sens : vue → store → service.
  - vue : les composants React, qui affichent l'écran et captent les actions ;
  - store : l'état partagé entre les écrans (voir ADR-005) ;
  - service : les appels à l'API, seule couche qui parle au back.
- Dans les deux cas, le couplage va dans un seul sens : une couche ne connaît jamais celle qui l'appelle.

### Stack

TypeScript partout, React avec Vite, TanStack Query, NestJS, PostgreSQL, Prisma.

## Pourquoi cette architecture

1. **Mon contexte** : seul, débutant sur la stack, avec cinq mois devant moi. L'option 2 est celle que je peux livrer à temps.
2. **Je connais déjà les couches** : je peux me concentrer sur TypeScript, NestJS et le métier.
3. **En choisissant moi-même mes couches**, je comprendrai les principes SOLID, au lieu d'appliquer une structure toute faite.
4. **Elle coche ce qu'attend le titre**, et c'est ce que font Finary et Monarch : un back principal et un front séparé.

## Pourquoi cette stack

### TypeScript

- Les erreurs de type sont vues dans l'éditeur, avant l'exécution (par exemple un montant reçu en texte « 100 » au lieu du nombre 100).
- Front et back dans le même langage → ils partagent les mêmes types (par exemple `Account`) ; un champ changé côté back casse la compilation du front, pas l'application.
- Un seul langage à maîtriser, pour un développeur seul.
- NestJS et Prisma sont conçus pour TypeScript ; Angular, prévu dans ma roadmap, l'impose.
- Très demandé en entreprise.
- Limite : les types disparaissent à l'exécution → les données qui arrivent de l'extérieur sont validées à l'exécution.

### React

- Déjà pratiqué sur plusieurs projets, dont la v0 → mon effort d'apprentissage va à TypeScript et NestJS.
- La bibliothèque front la plus utilisée → beaucoup d'offres d'emploi, de documentation et de bibliothèques (TanStack Query, React Router, i18next).
- Je prépare les certifications React, Junior puis Intermédiaire → le projet me sert d'entraînement.
- Limite : React ne gère que l'affichage → routage, état et traductions viennent de bibliothèques à choisir.

### NestJS

- Il impose une organisation en modules, contrôleurs et services, qui colle à mon architecture en couches.
- Injection de dépendances : Nest fabrique les objets et les fournit → en test, je remplace la vraie base par une imitation (un mock), sans toucher au service.
- Écrit en TypeScript ; la documentation Swagger est générée depuis le code.
- Il tourne au-dessus d'Express, que je connais.
- Mêmes concepts que Spring (Java) et Angular → compétences transférables.
- Limite : plus de concepts à apprendre, et plus de code pour un petit projet.

### Prisma

- Un seul fichier, `schema.prisma` → les migrations (les tables) et un client TypeScript typé.
- Les requêtes sont vérifiées à la compilation : pas de colonne mal orthographiée.
- Les migrations sont versionnées dans Git et rejouées à l'identique sur chaque machine et en production.
- Les requêtes sont paramétrées par défaut → protection contre les injections SQL.
- Limite : le SQL doit rester compris → chaque requête Prisma est écrite avec son équivalent SQL ; le SQL brut reste possible pour les cas complexes.

### PostgreSQL

- Base relationnelle : transactions, clés étrangères, contraintes → des données financières cohérentes.
- `numeric` pour des montants exacts ; `JSONB` pour les données semi-structurées des imports.
- Libre et gratuit, proposé par les principaux hébergeurs.
- Version 18 → la plus récente stable (support jusqu'en novembre 2030), avec `uuidv7()` : des identifiants triés par date de création.

## Conséquences

**Ce que j'y gagne** : un seul back à déployer, une organisation simple, des modules qui suivent mes epics.

**Ce qu'il faudra surveiller :**

- des services qui grossissent trop → les découper ;
- le couplage entre modules → toujours passer par les services ;
- tester les règles métier demandera de simuler la base dans les tests.

## Évolution envisagée

Quand le MVP aura été testé et que le projet grandira — d'autres développeurs, la V2, FinOps — passer à l'architecture hexagonale, dans un nouvel ADR. Les modules par domaine faciliteront cette migration.
