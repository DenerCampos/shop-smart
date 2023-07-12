import { AppConfig } from 'src/config/app.config';

const appConfig = new AppConfig();

export const jwtConstants = {
  secret: appConfig.getJwtSecretKey(),
};
