/* ==========================================================
 *  app.spec.ts : les tests du composant racine
 *  Le nom, la phrase en français par défaut, puis en anglais
 * ========================================================== */

import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { App } from './app';
import { LanguageStore } from './i18n/language-store';

describe('App', () => {
  // Avant chaque test : navigateur vidé, traduction fournie, français choisi
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideTranslateService({ fallbackLang: 'fr' })],
    }).compileComponents();
    TestBed.inject(LanguageStore).use('fr');
  });

  // Le nom de l'appli s'affiche
  it('shows the app name', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('h1')?.textContent).toContain('FinancePilot');
  });

  // La phrase est en français par défaut, et <html lang> vaut "fr"
  it('shows the tagline in French by default', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('p')?.textContent).toContain('Tous vos comptes');
    expect(document.documentElement.lang).toBe('fr');
  });

  // Après un changement de langue, la phrase passe en anglais
  it('switches the tagline to English', async () => {
    const fixture = TestBed.createComponent(App);
    TestBed.inject(LanguageStore).use('en');
    await fixture.whenStable();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('p')?.textContent).toContain('All your accounts');
    expect(document.documentElement.lang).toBe('en');
  });
});
