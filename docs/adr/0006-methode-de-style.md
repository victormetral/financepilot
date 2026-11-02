# ADR-006 — Méthode de style du front

- **Date** : 02/11/2026
- **Statut** : proposée
- **Lié à** : ADR-001 (stack du front), identité visuelle du 28/10/2026 (thème sombre par défaut)

## Contexte

- Les maquettes Figma comptent 26 composants, 20 couleurs en clair et en sombre, 3 arrondis et 6 styles de texte.
- Les variables Figma sont déjà dans le front, dans `src/styles/tokens.css`.
- Il manque la façon d'écrire le style de chaque composant.

## Options envisagées

1. **CSS global** : un seul fichier pour toute l'appli ; deux composants peuvent utiliser le même nom de classe sans le savoir.
2. **CSS Modules** (intégré à Vite) : un petit fichier `.css` à côté de chaque composant ; les noms de classes sont isolés automatiquement.
3. **Tailwind CSS** : le style s'écrit avec des classes directement dans le JSX ; chaque classe correspond à une propriété CSS.
4. **CSS-in-JS** (styled-components, Emotion) : écarté ; styled-components est en maintenance et son mainteneur le déconseille pour un nouveau projet.

## Décision

- Tailwind CSS 4, avec son plugin Vite.
- Les variables Figma deviennent le thème de Tailwind (`@theme` dans `tokens.css`) : `--color-canvas` donne `bg-canvas`, `text-canvas`, `border-canvas`.
- La palette par défaut de Tailwind est retirée : seules les couleurs et les arrondis de Figma existent.
- Nommage : le nom Figma, sans le groupe quand la classe le dit déjà → `bg/canvas` devient `bg-canvas`, `text/primary` devient `text-primary` ; les groupes `accent`, `status` et `chart` sont gardés (`bg-accent-action`).
- Les espacements de Figma (4 à 24 px) correspondent déjà à ceux de Tailwind : `p-1` = 4 px … `p-6` = 24 px.
- Thème sombre par défaut (`color-scheme: dark`) ; chaque couleur porte ses deux valeurs avec `light-dark(clair, sombre)`, pour l'option claire à venir.
- Pas de CSS Modules en plus : la documentation de Tailwind déconseille de mélanger les deux.

## Pourquoi

1. J'ai comparé le même bouton écrit des deux façons : avec Tailwind, tout est dans un seul fichier, et le style se lit à côté de l'élément.
2. Les classes viennent directement des variables Figma → le code reste fidèle à la maquette, et une couleur hors du design est refusée.
3. C'est la méthode de style la plus utilisée : 51 % des répondants (State of CSS 2025), contre 28 % pour CSS Modules → très présente dans les offres.
4. Elle marche avec les décisions déjà prises : variables CSS, `light-dark()`, thème sombre par défaut.

## Conséquences

**Ce que j'y gagne** : un style écrit vite, un seul fichier par composant, fidèle à Figma.

**Ce qu'il faudra surveiller :**

- Tailwind cache le CSS → pour chaque classe, savoir dire quelle propriété CSS elle produit (la documentation l'affiche pour chacune) ;
- des listes de classes trop longues → découper en petits composants ;
- les tests ne vérifient jamais les classes : ils cherchent les éléments par leur rôle (Testing Library).
