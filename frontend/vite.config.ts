/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tests : un faux navigateur (jsdom) et un fichier de préparation
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})