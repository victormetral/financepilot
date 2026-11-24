/* ==========================================================
 *  language-store.spec.ts : les tests du choix de la langue
 *  Choix retenu, langue du navigateur, anglais par défaut
 * ========================================================== */

import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageStore } from './language-store';

describe('LanguageStore', () => {
  // Avant chaque test : navigateur vidé, traduction fournie
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'fr' })],
    });
  });

  // Après chaque test : on enlève les fausses langues de navigateur
  afterEach(() => vi.restoreAllMocks());

  // Un choix retenu passe en premier
  it('starts with the saved choice', () => {
    localStorage.setItem('lang', 'en');
    const store = TestBed.inject(LanguageStore);
    store.init();
    expect(store.current()).toBe('en');
  });

  // Sans choix retenu : la langue du navigateur
  it('starts with the browser language when nothing is saved', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr-FR']);
    const store = TestBed.inject(LanguageStore);
    store.init();
    expect(store.current()).toBe('fr');
  });

  // Navigateur dans une autre langue : l'anglais, la langue la plus comprise
  it('falls back to English for another browser language', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE']);
    const store = TestBed.inject(LanguageStore);
    store.init();
    expect(store.current()).toBe('en');
  });

  // Le choix est retenu dans le navigateur
  it('remembers the choice', () => {
    const store = TestBed.inject(LanguageStore);
    store.use('en');
    TestBed.tick();
    expect(localStorage.getItem('lang')).toBe('en');
  });
});
