// Ajoute les vérifications du DOM (toBeInTheDocument…) à expect
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import i18n from '../i18n';

// Chaque test commence en français, quelle que soit la langue de la machine
beforeEach(async () => {
  await i18n.changeLanguage('fr');
});

// Vide la page après chaque test
afterEach(() => cleanup());

