/* ==========================================================
 *  app.module.ts : module racine du back
 *  Déclare les contrôleurs et les services de l'appli
 * ========================================================== */

import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

// Module racine : déclare qui fait partie de l'appli
@Module({
  // Autres modules utilisés (Sprint 1 : AuthModule, AccountsModule)
  imports: [],
  // Contrôleurs : reçoivent les requêtes
  controllers: [AppController],
  // Services : Nest les fabrique et les injecte
  providers: [AppService],
})
export class AppModule {}