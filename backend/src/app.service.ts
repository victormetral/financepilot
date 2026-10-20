/* ==========================================================
 *  app.service.ts : service de démo
 *  Prépare la réponse de GET / (ici, un simple texte)
 * ========================================================== */

import { Injectable } from '@nestjs/common';

// Service injectable : Nest le fabrique et le fournit
@Injectable()
export class AppService {
  // Renvoie le texte de la page d'accueil
  getHello(): string {
    return 'Hello World!';
  }
}
