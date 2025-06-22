import { Module } from '@nestjs/common';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { UserModule } from 'src/user/user.module';
import { StoreRepository } from './repositories/store.repository';
import { CommonModule } from 'src/common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { EntityManager } from 'typeorm';

@Module({
  imports: [CommonModule, UserModule, TypeOrmModule.forFeature([Store])],
  controllers: [StoreController],
  providers: [
    StoreService,
    {
      provide: 'IStoreRepository',
      useClass: StoreRepository,
    },
  ],
  exports: [StoreService, 'IStoreRepository'],
})
export class StoreModule {}
