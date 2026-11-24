# ADR-010 — Traduction du front : ngx-translate

- **Date** : 18/11/2026
- **Statut** : acceptée
- **Remplace** : l'ADR-007 (i18next, lié à React)

## Contexte

- Le front passe à Angular (ADR-009) → i18next et son adaptateur React ne s'appliquent plus.
- US 0 → langue du navigateur (français ou anglais, sinon anglais), choix retenu, français quand un texte manque, `<html lang>` qui suit la langue.

## Options envisagées

- i18n intégrée d'Angular → un build par langue ; changer de langue recharge la page.
- Transloco → très complet ; mais sa version pour Angular 20 et plus n'existe qu'en alpha.
- i18next → son adaptateur Angular ne supporte pas Angular 22.
- ngx-translate 18.1 → stable, testé avec Angular 22, le plus utilisé ; à compléter par un petit service.

## Décision

ngx-translate : la plus stable, la plus utilisée et testée avec Angular 22. Les autres ne supportent pas Angular 22, ou imposent un build par langue et un rechargement de la page quand on change de langue.

## Conséquences

- **Ce que j'y gagne** → changement de langue sans rechargement ; fr.json et en.json réutilisés ; les deux langues intégrées à l'appli, disponibles hors ligne.
- **Ce que ça coûte** → un petit service à écrire (`LanguageStore`) : langue au démarrage, choix retenu, `<html lang>`.
- **Garde-fou** → en.json vérifié par TypeScript : une traduction manquante fait échouer le build.
- **Plus tard** → formats des dates et des montants (Intl) au Sprint 1.
