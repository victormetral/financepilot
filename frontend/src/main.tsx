import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Polices : Fraunces (titres et montants) et Manrope (texte), installées dans l'appli
import '@fontsource-variable/fraunces'
import '@fontsource-variable/manrope'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
