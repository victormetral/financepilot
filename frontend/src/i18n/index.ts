// ==========================================================
//  index.ts : la configuration des traductions (i18n)
//  Charge le français et l'anglais, détecte la langue
//  du navigateur et retient le choix de l'utilisateur
// ==========================================================

// Le moteur, le détecteur de langue et le lien avec React
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Les textes, inclus dans l'appli
import en from './en.json';
import fr from './fr.json';

// Les traductions par langue ("translation" = l'espace de noms par défaut)
export const resources = {
  fr: { translation: fr },
  en: { translation: en },
} as const;

// Accessibilité : la page annonce la langue choisie (<html lang="…">)
i18n.on('languageChanged', () => {
  document.documentElement.lang = i18n.resolvedLanguage ?? 'fr';
});

// Démarrage : le détecteur, le lien avec React, puis les réglages
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: ['fr', 'en'],
    fallbackLng: 'fr',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;