/* ==========================================================
 *  app.module.ts : module racine du back
 *  Réunit les modules de l'appli
 * ========================================================== */

import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module.js';

// Module racine : déclare qui fait partie de l'appli
@Module({
  // Modules de l'appli (Sprint 1 : AuthModule, AccountsModule)
  imports: [HealthModule],
})
export class AppModule {}
