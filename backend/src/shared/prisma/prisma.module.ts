/* ==========================================================
 *  prisma.module.ts : le module de la base
 *  Fabrique PrismaService et le partage avec les autres modules
 * ========================================================== */

import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

// Module de la base : à importer dans chaque module qui lit ou écrit en base
@Module({
  // Nest fabrique le service ici
  providers: [PrismaService],
  // Et le partage avec les modules qui importent PrismaModule
  exports: [PrismaService],
})
export class PrismaModule {}
