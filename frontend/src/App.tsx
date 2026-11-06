// ==========================================================
//  App.tsx : le composant racine du front
//  Affiche l'application ; les pages arriveront au Sprint 1
// ==========================================================

// Le hook qui donne accès aux traductions
import { useTranslation } from 'react-i18next';

// Composant racine : le nom de l'appli et son slogan, dans la langue choisie
function App() {
  const { t } = useTranslation();

  return (
    <main className="p-6">
      <h1 className="font-serif text-display-total">{t('app.name')}</h1>
      <p className="text-body-md text-secondary">{t('app.tagline')}</p>
    </main>
  );
}

export default App;