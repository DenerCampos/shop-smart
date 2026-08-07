import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_CHANNELS,
  NotificationChannelName,
} from '../types/notification-channel.type';
import { InAppChannel } from './in-app.channel';
import { INotificationChannel } from './notification-channel.interface';

@Injectable()
export class NotificationChannelRegistry {
  private readonly channels = new Map<
    NotificationChannelName,
    INotificationChannel
  >();

  constructor(inAppChannel: InAppChannel) {
    this.channels.set(NOTIFICATION_CHANNELS.IN_APP, inAppChannel);
  }

  resolve(names: NotificationChannelName[]): INotificationChannel[] {
    return names
      .map((name) => this.channels.get(name))
      .filter((channel): channel is INotificationChannel => Boolean(channel));
  }

  defaultChannels(): NotificationChannelName[] {
    return [NOTIFICATION_CHANNELS.IN_APP];
  }
}
