import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const appConfig = new AppConfig();
  const { host, port } = appConfig.getApi();

  if (appConfig.isDevelopment()) {
    console.log('API Shop Smart');
    console.log('HOST: ', host);
    console.log('PORT: ', port);
  }

  await app.listen(port, host);
}

bootstrap().catch((error) => console.log(error));
