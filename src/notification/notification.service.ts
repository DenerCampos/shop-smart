import { Inject, Injectable, Logger } from '@nestjs/common';
import { logJson } from 'src/common/logging/log-event.util';
import { NotificationChannelRegistry } from './channels/channel.registry';
import { Notification } from './entities/notification.entity';
import { INotificationRepository } from './interfaces/notification.repository.interface';
import {
  DeliveryResult,
  NotificationPayload,
  NotifyInput,
} from './types/notify-input.type';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
    private readonly channelRegistry: NotificationChannelRegistry,
  ) {}

  async notify(input: NotifyInput): Promise<DeliveryResult[]> {
    const channels = this.channelRegistry.resolve(
      input.channels?.length
        ? input.channels
        : this.channelRegistry.defaultChannels(),
    );

    const payload: NotificationPayload = {
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      actorName: input.actorName,
      actionUrl: input.actionUrl,
      data: input.data ?? null,
    };

    const results: DeliveryResult[] = [];

    for (const channel of channels) {
      try {
        const result = await channel.send(payload);
        results.push(result);

        if (!result.success) {
          logJson(this.logger, {
            event: 'notification_channel_failed',
            channel: channel.name,
            userId: input.userId,
            type: input.type,
            error_message: result.error ?? 'Unknown channel error',
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.push({
          channel: channel.name,
          success: false,
          error: errorMessage,
        });
        logJson(this.logger, {
          event: 'notification_channel_exception',
          channel: channel.name,
          userId: input.userId,
          type: input.type,
          error_message: errorMessage,
        });
      }
    }

    return results;
  }

  async listForUser(userId: string, limit = 20): Promise<Notification[]> {
    return await this.notificationRepository.findByUserId(userId, limit);
  }

  async unreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.countUnreadByUserId(userId);
  }

  async markAsRead(userId: string, ids: string[]): Promise<number> {
    return await this.notificationRepository.markAsReadByIds(userId, ids);
  }
}
