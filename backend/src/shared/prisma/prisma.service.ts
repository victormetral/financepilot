/* ==========================================================
 *  prisma.service.ts : le pont entre NestJS et la base
 *  Ouvre et ferme la connexion ; les repositories l'utilisent
 * ========================================================== */

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';

// Service injectable qui hérite de toutes les méthodes de PrismaClient
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Prépare la connexion : l'adaptateur PostgreSQL et l'adresse lue dans .env
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    super({ adapter });
  }

  // Au démarrage du module : ouvre la connexion
  async onModuleInit() {
    await this.$connect();
  }

  // À l'arrêt du serveur : ferme la connexion proprement
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
