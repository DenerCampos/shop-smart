import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreRepository } from './store.repository';
import { DataSource } from 'typeorm';
import { Store } from './entities/store.entity';
import { getDataSourceToken } from '@nestjs/typeorm';

@Module({
  imports: [],
  controllers: [StoreController],
  providers: [
    {
      provide: StoreRepository,
      useFactory: (dataSource: DataSource) => {
        return new StoreRepository(dataSource.getRepository(Store));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: StoreService,
      useFactory: (gateway: StoreRepository) => {
        return new StoreService(gateway);
      },
      inject: [StoreRepository],
    },
  ],
})
export class StoreModule {}
