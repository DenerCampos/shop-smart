import { Test, TestingModule } from '@nestjs/testing';
import { NotificationChannelRegistry } from '../channels/channel.registry';
import { INotificationChannel } from '../channels/notification-channel.interface';
import { INotificationRepository } from '../interfaces/notification.repository.interface';
import { NotificationService } from '../notification.service';
import { NOTIFICATION_CHANNELS } from '../types/notification-channel.type';
import { NOTIFICATION_TYPES } from '../types/notification-type.type';

describe('NotificationService', () => {
  let service: NotificationService;
  let repository: jest.Mocked<INotificationRepository>;
  let channelRegistry: jest.Mocked<
    Pick<NotificationChannelRegistry, 'resolve' | 'defaultChannels'>
  >;
  let inAppChannel: jest.Mocked<INotificationChannel>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      countUnreadByUserId: jest.fn(),
      markAsReadByIds: jest.fn(),
    };

    inAppChannel = {
      name: NOTIFICATION_CHANNELS.IN_APP,
      send: jest.fn().mockResolvedValue({
        channel: NOTIFICATION_CHANNELS.IN_APP,
        success: true,
      }),
    };

    channelRegistry = {
      defaultChannels: jest
        .fn()
        .mockReturnValue([NOTIFICATION_CHANNELS.IN_APP]),
      resolve: jest.fn().mockReturnValue([inAppChannel]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: 'INotificationRepository', useValue: repository },
        { provide: NotificationChannelRegistry, useValue: channelRegistry },
      ],
    }).compile();

    service = module.get(NotificationService);
  });

  it('notify dispara canais padrão e isola falhas', async () => {
    const failingChannel: INotificationChannel = {
      name: NOTIFICATION_CHANNELS.EMAIL,
      send: jest.fn().mockRejectedValue(new Error('smtp down')),
    };
    channelRegistry.resolve.mockReturnValue([inAppChannel, failingChannel]);

    const results = await service.notify({
      userId: 'user-1',
      type: NOTIFICATION_TYPES.FAMILY_GROUP_INVITE,
      title: 'Título',
      body: 'Corpo',
      actorName: 'Admin',
      actionUrl: '/new-resources/family?tab=invitations',
    });

    expect(inAppChannel.send).toHaveBeenCalledTimes(1);
    expect(results).toEqual([
      { channel: NOTIFICATION_CHANNELS.IN_APP, success: true },
      {
        channel: NOTIFICATION_CHANNELS.EMAIL,
        success: false,
        error: 'smtp down',
      },
    ]);
  });

  it('listForUser delega ao repositório com limit', async () => {
    repository.findByUserId.mockResolvedValue([]);
    await service.listForUser('user-1', 10);
    expect(repository.findByUserId).toHaveBeenCalledWith('user-1', 10);
  });

  it('unreadCount delega ao repositório', async () => {
    repository.countUnreadByUserId.mockResolvedValue(3);
    await expect(service.unreadCount('user-1')).resolves.toBe(3);
  });

  it('markAsRead delega ao repositório', async () => {
    repository.markAsReadByIds.mockResolvedValue(2);
    await expect(service.markAsRead('user-1', ['id-1', 'id-2'])).resolves.toBe(
      2,
    );
    expect(repository.markAsReadByIds).toHaveBeenCalledWith('user-1', [
      'id-1',
      'id-2',
    ]);
  });
});
