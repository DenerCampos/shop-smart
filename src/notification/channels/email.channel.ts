import { Injectable } from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { NOTIFICATION_CHANNELS } from '../types/notification-channel.type';
import {
  DeliveryResult,
  NotificationPayload,
} from '../types/notify-input.type';
import { INotificationChannel } from './notification-channel.interface';

@Injectable()
export class EmailChannel implements INotificationChannel {
  readonly name = NOTIFICATION_CHANNELS.EMAIL;

  constructor(private readonly emailService: EmailService) {}

  async send(payload: NotificationPayload): Promise<DeliveryResult> {
    if (!payload.recipientEmail) {
      return { channel: this.name, success: true, skipped: true };
    }

    const result = await this.emailService.sendNotification({
      to: payload.recipientEmail,
      toName: payload.recipientName ?? undefined,
      title: payload.title,
      body: payload.body,
      actorName: payload.actorName,
      actionUrl: payload.actionUrl,
    });

    return {
      channel: this.name,
      success: result.success,
      error: result.error,
    };
  }
}
