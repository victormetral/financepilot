/* ==========================================================
 *  app.ts : le composant racine de l'appli
 *  La première pièce affichée ; elle contiendra toutes les pages
 * ========================================================== */

// Outils Angular : le décorateur Component et la fonction signal
import { Component, signal } from '@angular/core';
// RouterOutlet : l'emplacement où le routeur affichera la page en cours
import { RouterOutlet } from '@angular/router';

// Décorateur : transforme la classe App en composant
@Component({
  // Les pièces utilisées dans le template
  imports: [RouterOutlet],
  // La balise HTML qui affiche ce composant : <app-root>
  selector: 'app-root',
  // Le style et le HTML du composant, dans deux fichiers voisins
  styleUrl: './app.css',
  templateUrl: './app.html',
})
// Classe : les données et le comportement du composant
export class App {
  // Signal : une valeur qui met l'écran à jour quand elle change
  protected readonly title = signal('FinancePilot');
}
