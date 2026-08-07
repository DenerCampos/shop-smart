import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import {
  CreateNotificationData,
  INotificationRepository,
} from '../interfaces/notification.repository.interface';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationEntity: Repository<Notification>,
  ) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const notification = this.notificationEntity.create({
      user: { id: data.userId } as Notification['user'],
      type: data.type,
      title: data.title,
      body: data.body,
      actorName: data.actorName,
      actionUrl: data.actionUrl,
      data: data.data,
      readAt: null,
    });
    return await this.notificationEntity.save(notification);
  }

  async findByUserId(userId: string, limit: number): Promise<Notification[]> {
    // MySQL: NULL em ASC vem primeiro → não lidas (readAt null) acima das lidas
    return await this.notificationEntity
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.readAt', 'ASC')
      .addOrderBy('notification.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return await this.notificationEntity.count({
      where: {
        user: { id: userId },
        readAt: IsNull(),
      },
    });
  }

  async markAsReadByIds(userId: string, ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const result = await this.notificationEntity.update(
      {
        id: In(ids),
        user: { id: userId },
        readAt: IsNull(),
      },
      { readAt: new Date() },
    );

    return result.affected ?? 0;
  }
}
