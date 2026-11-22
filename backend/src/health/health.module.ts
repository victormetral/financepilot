/* ==========================================================
 *  health.module.ts : le module de santé
 *  Réunit le contrôleur, Terminus et l'accès à la base
 * ========================================================== */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from '../shared/prisma/prisma.module.js';
import { HealthController } from './health.controller.js';

// Module de santé : Terminus fait les vérifications, PrismaModule fournit la base
@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
