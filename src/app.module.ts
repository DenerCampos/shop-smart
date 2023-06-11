import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfig } from './config/typeorm.config';
import { StoreModule } from './store/store.module';
import { GroupModule } from './group/group.module';
import { ItemModule } from './item/item.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfig,
    }),
    StoreModule,
    GroupModule,
    ItemModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
