// ==========================================================
//  App.test.tsx : tests du composant racine
//  Vérifie que l'appli affiche son nom
// ==========================================================

// Outils : afficher un composant, puis le chercher dans la page
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

// Groupe de tests du composant App
describe('App', () => {
  // Un test : l'appli affiche son nom
  it('shows the app name', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'FinancePilot' })).toBeInTheDocument();
  });
});