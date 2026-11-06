# ADR-007 — Internationalisation du front

- **Date** : 06/11/2026
- **Statut** : proposée
- **Lié à** : US 0 (utiliser l'appli en anglais), ADR-001 (stack du front)

## Contexte

- L'US 0 demande l'appli en français et en anglais.
- Décision du 12/10/2026 : l'architecture multilingue dès le Sprint 0, la traduction anglaise à la fin de la V1.
- Sans préparation, il faudrait reprendre chaque écran pour en sortir les textes.
- Ce que l'US attend : la langue du navigateur à la 1re visite, un choix mémorisé, seulement le français et l'anglais, le français quand un texte manque, et une page qui annonce sa langue aux lecteurs d'écran (RGAA).

## Options envisagées

1. **i18next + react-i18next** : la plus utilisée ; un détecteur de langue prêt à l'emploi ; des clés vérifiées par TypeScript.
2. **react-intl** (FormatJS) : solide, basée sur le standard ICU ; 8 fois moins utilisée.
3. **Lingui** : des fichiers légers ; demande un outil de compilation en plus.
4. **Fait maison** (un objet de textes et un contexte React) : rien à installer ; détection, mémoire du choix et pluriels à coder.

## Décision

- i18next 26 et react-i18next 17, avec le détecteur de langue du navigateur.
- Un dossier `src/i18n/` : `index.ts` (configuration), `fr.json`, `en.json` et `i18next.d.ts` (les types).
- Les textes sont inclus dans l'appli, pas chargés par le réseau.
- Clés en anglais, rangées par écran : `app.tagline`, `dashboard.total`.
- Clés typées : le français sert de référence ; une clé inconnue est une erreur TypeScript.
- Langue : le choix mémorisé dans le navigateur (`localStorage`), sinon celle du navigateur ; seulement `fr` et `en` ; le français par défaut et en secours.
- L'attribut `lang` de la page suit la langue choisie.
- Dates et montants : `Intl.DateTimeFormat` et `Intl.NumberFormat`, intégrés au navigateur.
- Tests : chaque test démarre en français, quelle que soit la langue de la machine.

## Pourquoi

1. C'est la bibliothèque la plus utilisée (34,6 millions de téléchargements par semaine pour i18next, contre 4,4 pour react-intl) : beaucoup de documentation, et présente dans les offres.
2. Le détecteur couvre déjà 3 attentes de l'US : la langue du navigateur, le choix mémorisé, les langues limitées.
3. Les clés typées attrapent une faute de frappe avant même de lancer l'appli.
4. Des textes inclus dans l'appli → elle marche hors ligne (PWA), sans chargement en plus.

## Conséquences

**Ce que j'y gagne** : aucun texte écrit en dur dès le premier écran ; la traduction anglaise se fera à la fin, fichier par fichier.

**Ce qu'il faudra surveiller :**

- chaque nouveau texte va dans `fr.json` et `en.json`, jamais dans le composant (vérifié par la Definition of Done) ;
- des fichiers qui grossissent → les découper par domaine (espaces de noms) ;
- le choix de langue passera dans le profil quand il existera, pour le retrouver d'une connexion à l'autre ;
- les e-mails en anglais se traduiront côté back, dans le module des e-mails.
