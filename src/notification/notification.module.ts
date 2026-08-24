import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { EmailModule } from 'src/email/email.module';
import { UserModule } from 'src/user/user.module';
import { EmailChannel } from './channels/email.channel';
import { InAppChannel } from './channels/in-app.channel';
import { NotificationChannelRegistry } from './channels/channel.registry';
import { Notification } from './entities/notification.entity';
import { NotificationEventsListener } from './listeners/notification-events.listener';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [
    CommonModule,
    UserModule,
    EmailModule,
    TypeOrmModule.forFeature([Notification]),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationEventsListener,
    InAppChannel,
    EmailChannel,
    NotificationChannelRegistry,
    {
      provide: 'INotificationRepository',
      useClass: NotificationRepository,
    },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
