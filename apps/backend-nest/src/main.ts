// main.ts — bootstrap: load config, install validation pipe, enable CORS, listen.
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() : Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const allowedOrigins = config
    .getOrThrow<string>('ALLOWED_CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  });

  const port = config.getOrThrow<number>('PORT');
  await app.listen(port);
  console.log(`backend-nest listening on http://localhost:${port}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}
bootstrap();
