/* ==========================================================
 *  main.ts : point de départ du back
 *  Crée l'appli, ajoute le préfixe /api, branche Swagger
 *  (en local seulement), démarre le serveur
 * ========================================================== */

// Lit backend/.env et remplit process.env (en premier, avant tout le reste)
import 'dotenv/config';
import type { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

// Fonction de démarrage
async function bootstrap(): Promise<void> {
  // Fabrique l'appli à partir du module racine
  const app = await NestFactory.create(AppModule);

  // Toutes les routes commencent par /api (orchestra envoie /api/... à l'API)
  app.setGlobalPrefix('api');

  // Swagger seulement si SWAGGER_ENABLED vaut "true" : en local, jamais en production
  if (process.env.SWAGGER_ENABLED === 'true') {
    setupSwagger(app);
  }

  // Ouvre le serveur (port fourni, sinon 3000)
  await app.listen(process.env.PORT ?? 3000);
}

// Swagger : décrit l'API (titre, version) et l'affiche sur /api/docs
function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('FinancePilot API')
    .setVersion('0.1')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

// Lance le démarrage
await bootstrap();
