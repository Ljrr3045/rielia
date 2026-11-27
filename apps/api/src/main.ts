import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestNodeApplication } from '@nestjs/platform-node';
import { AppModule } from './app.module.js';
import { configureApplication, createHttpAdapter } from './application.js';
import { readApiPort } from './runtime/config.js';

async function bootstrap(): Promise<void> {
  const port = readApiPort();
  const app = await NestFactory.create<NestNodeApplication>(AppModule, createHttpAdapter(), {
    bodyParser: false,
  });
  configureApplication(app);
  app.enableShutdownHooks();
  await app.listen(port, process.env['HOST'] ?? '127.0.0.1');
}

bootstrap().catch(() => {
  console.error('API startup failed; check port and identity configuration.');
  process.exitCode = 1;
});
