import { Module } from '@nestjs/common';
import { RevenueController } from './revenue.controller';
import { UserModule } from 'src/user/user.module';
import { CommonModule } from 'src/common/common.module';
import { RevenueService } from './revenue.service';
import { RevenueRepository } from './repositories/revenue.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Revenue } from './entities/revenue.entity';

@Module({
  imports: [CommonModule, UserModule, TypeOrmModule.forFeature([Revenue])],
  controllers: [RevenueController],
  providers: [
    RevenueService,
    {
      provide: 'IRevenueRepository',
      useClass: RevenueRepository,
    },
  ],
  exports: [RevenueService, 'IRevenueRepository'],
})
export class RevenueModule {}
