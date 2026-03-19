import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { ExpenseModule } from 'src/expense/expense.module';
import { RevenueModule } from 'src/revenue/revenue.module';
import { FamilyGroupController } from './family-group.controller';
import { FamilyGroupService } from './family-group.service';
import { FamilyGroupRepository } from './repositories/family-group.repository';
import { FamilyGroup } from './entities/family-group.entity';
import { FamilyGroupMember } from './entities/family-group-member.entity';

@Module({
  imports: [
    CommonModule,
    UserModule,
    ExpenseModule,
    RevenueModule,
    TypeOrmModule.forFeature([FamilyGroup, FamilyGroupMember]),
  ],
  controllers: [FamilyGroupController],
  providers: [
    FamilyGroupService,
    {
      provide: 'IFamilyGroupRepository',
      useClass: FamilyGroupRepository,
    },
  ],
  exports: [FamilyGroupService],
})
export class FamilyGroupModule {}
