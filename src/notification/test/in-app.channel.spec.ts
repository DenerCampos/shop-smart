import { InAppChannel } from '../channels/in-app.channel';
import { INotificationRepository } from '../interfaces/notification.repository.interface';
import { NOTIFICATION_TYPES } from '../types/notification-type.type';
import { NotificationPayload } from '../types/notify-input.type';

describe('InAppChannel', () => {
  let repository: jest.Mocked<INotificationRepository>;
  let channel: InAppChannel;

  const payload = (
    overrides: Partial<NotificationPayload> = {},
  ): NotificationPayload => ({
    userId: 'user-1',
    recipientEmail: 'user@test.com',
    recipientName: null,
    type: NOTIFICATION_TYPES.FAMILY_GROUP_INVITE,
    title: 'Convite para grupo familiar',
    body: 'Você foi convidado.',
    actorName: 'Admin',
    actionUrl: '/new-resources/family?tab=invitations',
    data: { groupId: 'group-1' },
    ...overrides,
  });

  beforeEach(() => {
    repository = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      findByUserId: jest.fn(),
      countUnreadByUserId: jest.fn(),
      markAsReadByIds: jest.fn(),
    };
    channel = new InAppChannel(repository);
  });

  it('persiste a notificação quando há userId', async () => {
    const result = await channel.send(payload());

    expect(repository.create).toHaveBeenCalledWith({
      userId: 'user-1',
      type: NOTIFICATION_TYPES.FAMILY_GROUP_INVITE,
      title: 'Convite para grupo familiar',
      body: 'Você foi convidado.',
      actorName: 'Admin',
      actionUrl: '/new-resources/family?tab=invitations',
      data: { groupId: 'group-1' },
    });
    expect(result).toEqual({ channel: 'in_app', success: true });
  });

  it('convidado sem conta não gera linha no inbox', async () => {
    const result = await channel.send(payload({ userId: null }));

    expect(repository.create).not.toHaveBeenCalled();
    expect(result).toEqual({ channel: 'in_app', success: true, skipped: true });
  });

  it('erro do repositório vira falha do canal', async () => {
    repository.create.mockRejectedValue(new Error('db down'));

    const result = await channel.send(payload());

    expect(result).toEqual({
      channel: 'in_app',
      success: false,
      error: 'db down',
    });
  });
});
