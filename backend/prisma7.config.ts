/* ==========================================================
 *  prisma7.config.ts : les réglages de Prisma
 *  Où trouver le schéma, les migrations et l'adresse de la base
 * ========================================================== */

// Lit backend/.env et remplit process.env
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Configuration lue par la ligne de commande Prisma
export default defineConfig({
  // Le schéma des tables
  schema: 'prisma/schema.prisma',
  // Le dossier des migrations (l'historique des changements de tables)
  migrations: {
    path: 'prisma/migrations',
  },
  // L'adresse de la base, lue dans .env
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});