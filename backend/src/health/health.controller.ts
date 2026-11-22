/* ==========================================================
 *  health.controller.ts : la route de santé de l'API
 *  GET /api/health → 200 si l'API et la base répondent,
 *  503 sinon ; la sonde d'orchestra (Uptime Kuma) l'appelle
 * ========================================================== */

import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import type { HealthCheckResult } from '@nestjs/terminus';
import { PrismaService } from '../shared/prisma/prisma.service.js';

// Contrôleur sur /health (devient /api/health avec le préfixe global)
@Controller('health')
export class HealthController {
  // Injection : Nest fournit les 3 outils
  constructor(
    private readonly health: HealthCheckService,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  // Route GET /api/health : vérifie que la base répond à un ping
  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
