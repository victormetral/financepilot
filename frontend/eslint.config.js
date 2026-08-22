import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },

  /*
    FICHIERS DE TEST

    Vitest injecte describe, it, expect et vi au moment de
    l'exécution : ces noms n'apparaissent nulle part dans le
    code, et ESLint les prend donc pour des variables
    inexistantes.

    Les déclarer ici les rend légitimes — mais uniquement dans
    les fichiers de test. Les placer dans le bloc principal
    laisserait passer un `expect` égaré dans un composant.

    Ce bloc vient après le précédent : ESLint applique les
    blocs dans l'ordre, celui-ci ne fait qu'ajouter des
    variables globales aux réglages déjà en place.
  */
  {
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        vi: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
  },
])