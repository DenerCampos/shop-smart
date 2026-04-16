import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { useContainer } from 'class-validator';
import { AppModule } from 'src/app.module';
import { AppConfig } from 'src/common/app-config/app.config';

/**
 * Alinha o app de E2E ao bootstrap de main.ts (pipe, serialização, class-validator, CORS).
 * Não configura Winston nem listen.
 */
export function configureE2eApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const reflector = app.get(Reflector);
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const appConfig = new AppConfig();
  app.enableCors({
    origin: appConfig.getCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: '*',
    exposedHeaders: '*',
  });
}
