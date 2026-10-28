# ADR-005 — Gestion de l'état du front

- **Date** : 28/10/2026
- **Statut** : proposée
- **Lié à** : ADR-001 (front en trois couches : vue → store → service)

## Contexte

- Le front suit trois couches : vue → store → service (ADR-001).
- Le store détient l'état partagé entre les écrans : comptes, soldes, chargement, erreurs.
- Presque toutes ces données viennent de l'API : c'est de l'état serveur, dont la source de vérité est le back.
- Pour chacune, il faut gérer le chargement, les erreurs, le cache et le rechargement après une modification.

## Options envisagées

1. **Context de React** (intégré) : rien à installer ; pas de cache, tout est à coder.
2. **Zustand** : un store simple et explicite ; chargement, erreurs et cache restent à coder.
3. **Redux Toolkit** : très présent dans le code existant des grandes entreprises ; plus verbeux.
4. **TanStack Query** : gère seul le chargement, les erreurs, le cache et le rechargement des données du serveur.

## Décision

- TanStack Query pour l'état serveur.
- Le store prend la forme de hooks par domaine, au-dessus des services : `useAccounts()`, `useDeclareAccount()`…
- Le sens unique est respecté : la vue appelle un hook → le hook appelle le service → le service appelle l'API.
- Ce que l'utilisateur tape dans un formulaire reste dans la vue (`useState`).
- Zustand seulement si un état propre à l'interface doit être partagé entre écrans (par exemple la langue).

## Pourquoi

1. Les données de FinancePilot viennent presque toutes de l'API : c'est le rôle exact de TanStack Query.
2. Moins de code à écrire et à tester : chargement, erreurs et cache sont déjà gérés.
3. Après une modification (déclarer un compte), le total se met à jour en invalidant le cache, sans code de synchronisation.
4. La bibliothèque la plus utilisée pour charger des données en React : 68 % des répondants (State of React 2025).

## Conséquences

**Ce que j'y gagne** : des écrans plus simples, des données à jour sans code de synchronisation.

**Ce qu'il faudra surveiller :**

- la mécanique est cachée → savoir expliquer le cache (clés de requête, invalidation) ;
- les tests des vues devront fournir un client TanStack Query.
