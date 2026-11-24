/* ==========================================================
 *  app.config.ts : la configuration de l'appli
 *  Les fournisseurs : routeur, traduction, choix de la langue au démarrage
 * ========================================================== */

import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { routes } from './app.routes';
import { LanguageStore } from './i18n/language-store';

export const appConfig: ApplicationConfig = {
  providers: [
    // Les erreurs non attrapées remontent dans la console
    provideBrowserGlobalErrorListeners(),
    // Le routeur et la liste des pages
    provideRouter(routes),
    // La traduction, avec le français en secours
    provideTranslateService({ fallbackLang: 'fr' }),
    // Au démarrage : choisir la langue avant le premier affichage
    provideAppInitializer(() => inject(LanguageStore).init()),
  ],
};
