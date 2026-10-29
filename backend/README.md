# FinancePilot — API

API REST de FinancePilot : NestJS 12, Prisma 7, PostgreSQL 18, tests Vitest.

Installation et lancement → voir le [README principal](../README.md).

## Commandes

| Commande | Rôle |
|---|---|
| `npm run start:dev` | lance l'API, qui se recharge à chaque modification |
| `npm test` | tests unitaires |
| `npm run test:e2e` | tests de bout en bout |
| `npm run lint` | analyse du code (oxlint) |
| `npm run build` | compile le TypeScript dans `dist/` |

## Architecture

Contrôleur → service → repository ([ADR-001](../docs/adr/0001-architecture-de-base.md)).

Documentation de l'API (Swagger) → http://localhost:3000/api
