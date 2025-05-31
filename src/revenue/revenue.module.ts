import { forwardRef, Module } from '@nestjs/common';
import { RevenueController } from './revenue.controller';
import { RevenueService } from './revenue.service';
import { RevenueRepository } from './revenue.repository';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Revenue } from './entities/revenue.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [forwardRef(() => UserModule)],
  controllers: [RevenueController],
  providers: [
    {
      provide: RevenueRepository,
      useFactory: (dataSource: DataSource) => {
        return new RevenueRepository(dataSource.getRepository(Revenue));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: RevenueService,
      useFactory: (gateway: RevenueRepository) => {
        return new RevenueService(gateway);
      },
      inject: [RevenueRepository],
    },
  ],
  exports: [RevenueService, RevenueRepository],
})
export class RevenueModule {}
