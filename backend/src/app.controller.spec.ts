/* ==========================================================
 *  app.controller.spec.ts : test unitaire d'AppController
 *  Vérifie que la route GET / renvoie "Hello World!"
 * ========================================================== */

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

// Groupe de tests du contrôleur
describe('AppController', () => {
  // Le contrôleur testé, recréé avant chaque test
  let appController: AppController;

  // Avant chaque test : fabrique une mini-appli et récupère le contrôleur
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  // Sous-groupe : la route /
  describe('root', () => {
    // Le test : getHello() doit renvoyer "Hello World!"
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});