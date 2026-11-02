# FinancePilot — Front

Interface web de FinancePilot : React 19, Vite 8, TypeScript, tests Vitest et Testing Library.

Installation et lancement → voir le [README principal](../README.md).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | lance le front sur http://localhost:5173, qui se recharge à chaque modification |
| `npm test` | tests (Vitest, Testing Library) |
| `npm run lint` | analyse du code (oxlint) |
| `npm run build` | vérifie les types, puis fabrique l'appli dans `dist/` |
| `npm run preview` | sert la version fabriquée, pour la vérifier avant la mise en ligne |

## Architecture

Vue → store → service ([ADR-001](../docs/adr/0001-architecture-de-base.md)).
