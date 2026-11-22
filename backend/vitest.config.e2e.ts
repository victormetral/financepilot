import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // Charge backend/.env avant les tests (en CI, DATABASE_URL vient du workflow)
    setupFiles: ['dotenv/config'],
  },
});
