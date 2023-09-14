import { Module } from '@nestjs/common';
import { CouponReaderController } from './couponReader.controller';
import { CouponReaderService } from './couponReader.service';
import { UserModule } from 'src/user/user.module';
import { GroupRepository } from 'src/group/group.repository';
import { DataSource } from 'typeorm';
import { Group } from 'src/group/entities/group.entity';
import { getDataSourceToken } from '@nestjs/typeorm';

@Module({
  imports: [UserModule],
  controllers: [CouponReaderController],
  providers: [
    {
      provide: GroupRepository,
      useFactory: (dataSource: DataSource) => {
        return new GroupRepository(dataSource.getRepository(Group));
      },
      inject: [getDataSourceToken()],
    },
    {
      provide: CouponReaderService,
      useFactory: (gateway: GroupRepository) => {
        return new CouponReaderService(gateway);
      },
      inject: [GroupRepository],
    },
  ],
})
export class CouponReaderModule {}
