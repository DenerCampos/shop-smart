import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { UserModule } from 'src/user/user.module';
import { CommonModule } from 'src/common/common.module';
import { GroupService } from './group.service';
import { GroupRepository } from './repositories/group.repository';
import { Group } from './entities/group.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [CommonModule, UserModule, TypeOrmModule.forFeature([Group])],
  controllers: [GroupController],
  providers: [
    GroupService,
    {
      provide: 'IGroupRepository',
      useClass: GroupRepository,
    },
  ],
  exports: [GroupService, 'IGroupRepository'],
})
export class GroupModule {}
