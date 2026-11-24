/* ==========================================================
 *  language-store.ts : la langue de l'appli
 *  Choisit la langue au démarrage, la retient, met à jour <html lang>
 * ========================================================== */

import { DOCUMENT, effect, inject, Service } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import en from '../../i18n/en.json';
import fr from '../../i18n/fr.json';

// Les langues proposées, et la clé du choix retenu dans le navigateur
const SUPPORTED_LANGS = ['fr', 'en'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
const STORAGE_KEY = 'lang';

// Vérifie qu'une valeur est une langue proposée
function isAppLang(value: string | null | undefined): value is AppLang {
  return SUPPORTED_LANGS.includes(value as AppLang);
}

@Service()
export class LanguageStore {
  // Les outils reçus par injection
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  // La langue en cours, sous forme de signal
  readonly current = this.translate.currentLang;

  constructor() {
    // Les textes des deux langues ; "satisfies" vérifie qu'il ne manque aucune clé en anglais
    this.translate.setTranslation('fr', fr);
    this.translate.setTranslation('en', en satisfies typeof fr);

    // À chaque changement de langue : <html lang> et choix retenu
    effect(() => {
      const lang = this.current();
      if (!lang) return;
      this.document.documentElement.lang = lang;
      localStorage.setItem(STORAGE_KEY, lang);
    });
  }

  // Au démarrage : choix retenu, sinon langue du navigateur si proposée, sinon anglais
  init(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    const browser = this.translate.getBrowserLang();
    this.use(isAppLang(saved) ? saved : isAppLang(browser) ? browser : 'en');
  }

  // Changer de langue
  use(lang: AppLang): void {
    this.translate.use(lang);
  }
}
