// ==========================================================
//  App.test.tsx : tests du composant racine
//  Vérifie que l'appli affiche son nom
// ==========================================================

// Outils : afficher un composant, puis le chercher dans la page
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import i18n from './i18n';

// Groupe de tests du composant App
describe('App', () => {
  // Un test : l'appli affiche son nom
  it('shows the app name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'FinancePilot' })).toBeInTheDocument();
  });
});

  it('shows the tagline in French by default', () => {
    render(<App />);
    expect(screen.getByText(/sans jamais connecter votre banque/)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('fr');
  });

  it('shows the tagline in English when English is chosen', async () => {
    await i18n.changeLanguage('en');
    render(<App />);
    expect(screen.getByText(/without ever connecting your bank/)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
  });