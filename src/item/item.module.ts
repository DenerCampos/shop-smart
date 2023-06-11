import { Module } from '@nestjs/common';
import { ItemController } from './item.controller';
import { ItemService } from './item.service';
import { ItemRepository } from './item.repository';
import { DataSource } from 'typeorm';
import { Item } from './entities/item.entity';
import { getDataSourceToken } from '@nestjs/typeorm';

@Module({
  imports: [],
  controllers: [ItemController],
  providers: [
    {
      provide: ItemRepository,
      useFactory: (dataSource: DataSource) => {
        return new ItemRepository(dataSource.getRepository(Item));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: ItemService,
      useFactory: (gateway: ItemRepository) => {
        return new ItemService(gateway);
      },
      inject: [ItemRepository],
    },
  ],
})
export class ItemModule {}
