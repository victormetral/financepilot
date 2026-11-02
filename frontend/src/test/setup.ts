// Ajoute les vérifications du DOM (toBeInTheDocument…) à expect
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vide la page après chaque test
afterEach(() => cleanup());