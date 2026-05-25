import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { FamilyGroupModule } from 'src/family-group/family-group.module';
import { UserModule } from 'src/user/user.module';
import { CoinModule } from 'src/coin/coin.module';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { ChoreController } from './chore.controller';
import { ChoreService } from './chore.service';
import { ChoreRepository } from './repositories/chore.repository';
import { ChoreDefinition } from './entities/chore-definition.entity';
import { ChoreOccurrence } from './entities/chore-occurrence.entity';
import { ChorePayrollSettlement } from './entities/chore-payroll-settlement.entity';
import { ChorePayrollLine } from './entities/chore-payroll-line.entity';

@Module({
  imports: [
    CommonModule,
    FamilyGroupModule,
    UserModule,
    CoinModule,
    FileStorageModule,
    TypeOrmModule.forFeature([
      ChoreDefinition,
      ChoreOccurrence,
      ChorePayrollSettlement,
      ChorePayrollLine,
    ]),
  ],
  controllers: [ChoreController],
  providers: [
    { provide: 'IChoreRepository', useClass: ChoreRepository },
    ChoreService,
  ],
  exports: [ChoreService, 'IChoreRepository'],
})
export class ChoreModule {}
