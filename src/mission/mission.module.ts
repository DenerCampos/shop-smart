import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { CoinModule } from 'src/coin/coin.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { RevenueModule } from 'src/revenue/revenue.module';
import { UserModule } from 'src/user/user.module';
import { MissionDefinition } from './entities/mission-definition.entity';
import { UserMissionProgress } from './entities/user-mission-progress.entity';
import { MissionDefinitionRepository } from './repositories/mission-definition.repository';
import { UserMissionProgressRepository } from './repositories/user-mission-progress.repository';
import { MissionEventsListener } from './mission-events.listener';
import { MissionSchedulerService } from './mission-scheduler.service';
import { MissionService } from './mission.service';
import { MissionController } from './mission.controller';

@Module({
  imports: [
    CommonModule,
    CoinModule,
    ExpenseModule,
    RevenueModule,
    UserModule,
    TypeOrmModule.forFeature([MissionDefinition, UserMissionProgress]),
  ],
  controllers: [MissionController],
  providers: [
    MissionService,
    MissionEventsListener,
    MissionSchedulerService,
    {
      provide: 'IMissionDefinitionRepository',
      useClass: MissionDefinitionRepository,
    },
    {
      provide: 'IUserMissionProgressRepository',
      useClass: UserMissionProgressRepository,
    },
  ],
  exports: [MissionService],
})
export class MissionModule {}
