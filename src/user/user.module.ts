import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppConfig } from 'src/config/app.config';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [
    {
      provide: UserRepository,
      useFactory: (dataSource: DataSource) => {
        return new UserRepository(dataSource.getRepository(User));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: AppConfig, // Adicione o AppConfig como provedor
      useClass: AppConfig, // Especifique a classe do AppConfig
    },
    {
      provide: UserService,
      useFactory: (gateway: UserRepository, appConfig: AppConfig) => {
        return new UserService(gateway, appConfig);
      },
      inject: [UserRepository, AppConfig],
    },
  ],
})
export class UserModule {}
