/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Plugins : React, et Tailwind qui fabrique le CSS à partir des classes utilisées
  plugins: [react(), tailwindcss()],
  // Tests : un faux navigateur (jsdom) et un fichier de préparation
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})