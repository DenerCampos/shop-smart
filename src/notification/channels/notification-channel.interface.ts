import { NotificationChannelName } from '../types/notification-channel.type';
import {
  DeliveryResult,
  NotificationPayload,
} from '../types/notify-input.type';

export interface INotificationChannel {
  readonly name: NotificationChannelName;
  send(payload: NotificationPayload): Promise<DeliveryResult>;
}
