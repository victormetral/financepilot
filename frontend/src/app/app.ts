/* ==========================================================
 *  app.ts : le composant racine de l'appli
 *  La première pièce affichée ; elle contiendra toutes les pages
 * ========================================================== */

// Outil Angular : le décorateur Component
import { Component } from '@angular/core';
// RouterOutlet : l'emplacement où le routeur affichera la page en cours
import { RouterOutlet } from '@angular/router';
// TranslatePipe : traduit une clé dans le template ({{ 'cle' | translate }})
import { TranslatePipe } from '@ngx-translate/core';

// Décorateur : transforme la classe App en composant
@Component({
  // Les pièces utilisées dans le template
  imports: [RouterOutlet, TranslatePipe],
  // La balise HTML qui affiche ce composant : <app-root>
  selector: 'app-root',
  // Le style et le HTML du composant, dans deux fichiers voisins
  styleUrl: './app.css',
  templateUrl: './app.html',
})
// Classe : les données et le comportement du composant (vide pour l'instant)
export class App {}
