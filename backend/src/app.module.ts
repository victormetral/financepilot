/* ==========================================================
 *  app.module.ts : module racine du back
 *  Déclare les contrôleurs et les services de l'appli
 * ========================================================== */

// Autres modules utilisés : la base (PrismaModule), puis AuthModule, AccountsModule au Sprint 1
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

// Module racine : déclare qui fait partie de l'appli
@Module({
  // Autres modules utilisés (Sprint 1 : AuthModule, AccountsModule)
  imports: [PrismaModule],
  // Contrôleurs : reçoivent les requêtes
  controllers: [AppController],
  // Services : Nest les fabrique et les injecte
  providers: [AppService],
})
export class AppModule {}
