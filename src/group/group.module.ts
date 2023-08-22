import { Module } from '@nestjs/common';
import { GroupController } from './group.controller';
import { GroupService } from './group.service';
import { GroupRepository } from './group.repository';
import { DataSource } from 'typeorm';
import { Group } from './entities/group.entity';
import { getDataSourceToken } from '@nestjs/typeorm';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [UserModule],
  controllers: [GroupController],
  providers: [
    {
      provide: GroupRepository,
      useFactory: (dataSource: DataSource) => {
        return new GroupRepository(dataSource.getRepository(Group));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: GroupService,
      useFactory: (gateway: GroupRepository) => {
        return new GroupService(gateway);
      },
      inject: [GroupRepository],
    },
  ],
})
export class GroupModule {}
