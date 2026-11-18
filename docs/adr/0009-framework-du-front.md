# ADR-009 — Framework du front : Angular à la place de React

- **Date** : 17/11/2026
- **Statut** : acceptée (accord de Dimitri le 15/11)
- **Remplace** : la partie front de l'ADR-001 (React)

## Contexte

- Recherche d'alternance → beaucoup d'offres Angular, surtout dans les ESN.
- NestJS, mon back, s'inspire d'Angular.
- Le front React n'est encore qu'un socle → c'est le moment de changer.

## Options envisagées

- JavaScript vanilla → déjà pratiqué, rien de nouveau à apprendre ; mais aucune structure, tout à faire soi-même → difficile à maintenir sur une application d'un an.
- React → déjà un peu pratiqué, très demandé, souple : on choisit sa structure ; mais beaucoup de bibliothèques à choisir et à assembler soi-même.
- Angular → tout inclus, comme NestJS, qui s'en inspire ; TypeScript strict ; mais plus de code à écrire, plus à apprendre au début, et moins demandé que React hors ESN.

## Décision

Angular : plus adapté à une application de gestion financière grâce à son typage strict, très proche de NestJS, et apprendre un nouveau framework est important pour moi.

## Conséquences

- **Ce que j'y gagne** → un seul modèle du front au back ; routes, formulaires et HTTP inclus → moins de bibliothèques à choisir.
- **Ce que ça coûte** → refaire le socle front ; ADR-005 (état du front) à revoir ; ADR-007 (i18n) remplacé par l'ADR-010.
- **Ce qui ne change pas** → Tailwind, couleurs et polices Figma, Vitest.
