import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApplication } from './application.js';

async function bootstrap(): Promise<void> {
  const port = Number(process.env['PORT'] ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureApplication(app);
  app.enableShutdownHooks();
  await app.listen(port, process.env['HOST'] ?? '127.0.0.1');
}

bootstrap().catch(() => {
  console.error('API startup failed; check port and identity configuration.');
  process.exitCode = 1;
});
