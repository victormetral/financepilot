/* ==========================================================
 *  main.ts : point de départ du back
 *  Crée l'appli, branche Swagger, démarre le serveur
 * ========================================================== */

import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

// Fonction de démarrage
async function bootstrap() {
  // Fabrique l'appli à partir du module racine
  const app = await NestFactory.create(AppModule);

  // Swagger : décrit l'API (titre, version)
  const config = new DocumentBuilder()
    .setTitle('FinancePilot API')
    .setVersion('0.1')
    .build();

  // Swagger : génère la doc et l'affiche sur /api
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Ouvre le serveur (port fourni, sinon 3000)
  await app.listen(process.env.PORT ?? 3000);
}

// Lance le démarrage
await bootstrap();
