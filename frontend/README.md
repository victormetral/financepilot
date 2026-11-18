# FinancePilot — Front

Interface web de FinancePilot : Angular 22, TypeScript, Tailwind CSS, tests Vitest.

Installation et lancement → voir le [README principal](../README.md).

## Commandes

| Commande | Rôle |
|---|---|
| `npm start` | lance le front sur http://localhost:4200, qui se recharge à chaque modification |
| `npm test` | tests (Vitest) |
| `npm run lint` | analyse du code et des templates, accessibilité comprise (angular-eslint) |
| `npm run build` | fabrique l'appli dans `dist/` |

## Organisation

```
src/
├── app/
│   ├── app.ts, app.html      → le composant racine
│   ├── app.config.ts         → les fournisseurs : routeur, traduction
│   └── i18n/language-store.ts → la langue : navigateur, choix retenu, <html lang>
├── i18n/fr.json, en.json     → tous les textes de l'appli
└── styles/tokens.css         → couleurs, polices et tailles des maquettes Figma
```

## Règles

- Aucun texte écrit en dur dans un composant → il va dans `fr.json` et `en.json`.
- Couleurs et tailles → les classes tirées de `tokens.css`, jamais de valeur en dur.

## Décisions

- Angular → [ADR-009](../docs/adr/0009-framework-du-front.md)
- Traduction avec ngx-translate → [ADR-010](../docs/adr/0010-traduction-du-front.md)
- Tailwind CSS → [ADR-006](../docs/adr/0006-methode-de-style.md)
