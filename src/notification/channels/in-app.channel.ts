import { Inject, Injectable } from '@nestjs/common';
import { INotificationRepository } from '../interfaces/notification.repository.interface';
import { NOTIFICATION_CHANNELS } from '../types/notification-channel.type';
import {
  DeliveryResult,
  NotificationPayload,
} from '../types/notify-input.type';
import { INotificationChannel } from './notification-channel.interface';

@Injectable()
export class InAppChannel implements INotificationChannel {
  readonly name = NOTIFICATION_CHANNELS.IN_APP;

  constructor(
    @Inject('INotificationRepository')
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    // Convidado sem conta não tem inbox: só o canal de e-mail alcança.
    if (!payload.userId) {
      return { channel: this.name, success: true, skipped: true };
    }

    try {
      await this.notificationRepository.create({
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        actorName: payload.actorName,
        actionUrl: payload.actionUrl,
        data: payload.data,
      });

      return { channel: this.name, success: true };
    } catch (error) {
      return {
        channel: this.name,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
