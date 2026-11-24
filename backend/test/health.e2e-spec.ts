/* ==========================================================
 *  health.e2e-spec.ts : test de bout en bout de la santé
 *  Lance l'appli entière avec une vraie base, puis appelle
 *  GET /api/health comme le ferait la sonde d'orchestra
 * ========================================================== */

import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('GET /api/health (e2e)', () => {
  let app: INestApplication<App>;

  // Avant chaque test : l'appli entière, avec le même préfixe que main.ts
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  // Après chaque test : ferme l'appli et la connexion à la base
  afterEach(async () => {
    await app.close();
  });

  // La base répond → 200 et "database" est "up"
  it('returns 200 when the database is up', async () => {
    const response = await request(app.getHttpServer()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.info.database.status).toBe('up');
  });
});
