// ============================================================
// CONFIGURATION VITEST (BACKEND)
// ============================================================
//
// Le frontend n'a pas de fichier équivalent : Vitest y lit
// vite.config.js. Le backend n'utilise pas Vite, d'où ce
// fichier dédié.
//
// Périmètre volontairement restreint aux fonctions pures de
// src/utils/. Les services touchent PostgreSQL et les
// contrôleurs touchent Express : ils sont déjà couverts par les
// scripts bash, qui testent l'API réellement démarrée — un test
// plus proche de la réalité que des appels simulés.

import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // describe, it et expect disponibles sans import.
    globals: true,

    // Node, pas de navigateur : aucune de ces fonctions
    // ne touche au DOM.
    environment: "node",

    include: ["src/**/*.test.js"],
  },
})