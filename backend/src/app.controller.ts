/* ==========================================================
 *  app.controller.ts : contrôleur de démo
 *  Reçoit GET / et délègue la réponse au service
 * ========================================================== */

import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

// Contrôleur à la racine (/)
@Controller()
export class AppController {
  // Injection : Nest fournit le service
  constructor(private readonly appService: AppService) {}

  // Route GET / : renvoie la réponse du service
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
