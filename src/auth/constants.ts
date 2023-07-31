import { AppConfig } from 'src/common/app-config/app.config';

const appConfig = new AppConfig();

export const jwtConstants = {
  secret: appConfig.getJwtSecretKey(),
};
