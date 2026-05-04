import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { AppConfig } from './common/app-config/app.config';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { useContainer } from 'class-validator';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  // Express 5: manter parser "extended" (equivalente ao Express 4) para query strings
  app.set('query parser', 'extended');

  const appConfig = new AppConfig();
  const trustHops = appConfig.getTrustProxyHops();
  if (trustHops > 0) {
    app.set('trust proxy', trustHops);
  }

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

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

  // CORS configurado por ambiente (mesma origem que Socket.IO)
  const corsConfig = {
    origin: appConfig.getCorsOrigins(),
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: '*',
    exposedHeaders: '*',
  };

  app.enableCors(corsConfig);

  await app.listen(port, host);
}

bootstrap().catch((error) => console.log(error));
