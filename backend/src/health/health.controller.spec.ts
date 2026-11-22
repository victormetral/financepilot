/* ==========================================================
 *  health.controller.spec.ts : test unitaire de santé
 *  Remplace la base par une fausse qui ne répond pas, pour
 *  vérifier que la route renvoie bien 503 (service indisponible)
 * ========================================================== */

import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaService } from '../shared/prisma/prisma.service.js';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  // La base ne répond pas → la route renvoie 503
  it('throws 503 when the database does not answer', async () => {
    // Arrange : une fausse base dont chaque appel échoue
    const unreachableDatabase = {
      $runCommandRaw: vi
        .fn()
        .mockRejectedValue(new Error('Connection refused')),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [TerminusModule],
      controllers: [HealthController],
      providers: [{ provide: PrismaService, useValue: unreachableDatabase }],
    }).compile();
    const controller = moduleRef.get(HealthController);

    // Act + Assert : la vérification échoue avec une erreur 503
    await expect(controller.check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
