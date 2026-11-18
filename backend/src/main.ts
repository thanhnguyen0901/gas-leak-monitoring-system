import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app';
import { validateEnvironment } from './config';
export async function createApp() {
  validateEnvironment();
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn'] });
  app.enableCors({ origin: (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',') });
  app.enableShutdownHooks();
  return app;
}
if (require.main === module) {
  createApp().then(app => app.listen(Number(process.env.PORT || 3000), process.env.HOST || '127.0.0.1')).catch(() => {
    console.error('Backend startup failed; verify configuration and service availability'); process.exit(1);
  });
}
