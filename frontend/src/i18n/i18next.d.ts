// ==========================================================
//  i18next.d.ts : les clés de traduction connues de TypeScript
//  Une clé inconnue dans t('…') devient une erreur
// ==========================================================

// On complète les types de i18next (aucun code exécuté)
import 'i18next';
import type { resources } from './index';

// Le français sert de référence : seules ses clés sont acceptées
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: (typeof resources)['fr'];
  }
}