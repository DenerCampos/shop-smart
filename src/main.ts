import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './common/app-config/app.config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'development'
        ? ['log', 'debug', 'error', 'verbose', 'warn']
        : ['error', 'warn'], // Em produção mostra apenas erros e warnings
  });

  const appConfig = new AppConfig();
  const { host, port } = appConfig.getApi();

  if (appConfig.isDevelopment()) {
    console.log('API Shop Smart');
    console.log('HOST: ', host);
    console.log('PORT: ', port);
  }

  // Validações
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, //ignora tudo que não esta no DTO
      forbidNonWhitelisted: false, // lançar um erro se mandar dado que nao esta no DTO
    }),
  );

  // Serialização
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // class-validator resolve dependencias igual o nest
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  // CORS configurado por ambiente
  const corsConfig = {
    origin:
      process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // necessário para o ngrok e cookies
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ngrok-skip-browser-warning', // Header específico do ngrok
    ],
  };

  app.enableCors(corsConfig);

  await app.listen(port, host);
}

bootstrap().catch((error) => console.log(error));
