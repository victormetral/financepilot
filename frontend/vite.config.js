// ============================================================
// CONFIGURATION VITE ET VITEST
// ============================================================
//
// Vitest lit ce même fichier : les tests utilisent donc la
// configuration de l'application, sans réglage parallèle à
// maintenir. C'est la raison principale de l'avoir choisi
// plutôt que Jest, qui aurait exigé sa propre configuration
// pour comprendre les modules ES.

import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  test: {
    /*
      globals: true rend describe, it et expect disponibles
      sans import dans chaque fichier de test, comme en Jest.
      Sans cette option, chaque fichier commencerait par
      `import { describe, it, expect } from "vitest"`.
    */
    globals: true,

    /*
      Environnement Node et non navigateur : les fichiers
      testés ici sont du calcul pur, sans DOM. Un
      environnement navigateur simulé (jsdom) serait plus lent
      et inutile. Il faudra le prévoir le jour où l'on testera
      des composants React.
    */
    environment: "node",

    // Ne cherche les tests que dans src, pas dans node_modules.
    include: ["src/**/*.test.js"],
  },
})