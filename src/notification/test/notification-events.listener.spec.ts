import { EventEmitter } from 'events';
import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import {
  FAMILY_GROUP_MEMBER_INVITED_EVENT,
  FamilyGroupMemberInvitedEvent,
} from 'src/family-group/events/family-group-member-invited.event';
import { NotificationEventsListener } from '../listeners/notification-events.listener';
import { NotificationService } from '../notification.service';
import { NOTIFICATION_TYPES } from '../types/notification-type.type';

describe('NotificationEventsListener', () => {
  let eventEmitter: EventEmitter;
  let notificationService: jest.Mocked<Pick<NotificationService, 'notify'>>;

  beforeEach(async () => {
    eventEmitter = new EventEmitter();
    notificationService = {
      notify: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEventsListener,
        { provide: EVENT_EMITTER, useValue: eventEmitter },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    module.get(NotificationEventsListener).onModuleInit();
  });

  it('family_group.member_invited cria notificação interna', async () => {
    const createdAt = new Date('2026-08-07T12:00:00.000Z');
    eventEmitter.emit(
      FAMILY_GROUP_MEMBER_INVITED_EVENT,
      new FamilyGroupMemberInvitedEvent(
        'recipient-1',
        'Admin Nome',
        'group-1',
        'Família Teste',
        'member-1',
        createdAt,
      ),
    );

    await new Promise((resolve) => setImmediate(resolve));

    expect(notificationService.notify).toHaveBeenCalledWith({
      userId: 'recipient-1',
      type: NOTIFICATION_TYPES.FAMILY_GROUP_INVITE,
      title: 'Convite para grupo familiar',
      body: 'Você foi convidado(a) para integrar o grupo "Família Teste".',
      actorName: 'Admin Nome',
      actionUrl: '/new-resources/family?tab=invitations',
      data: {
        groupId: 'group-1',
        memberId: 'member-1',
      },
    });
  });

  it('falha no notify não propaga exceção do listener', async () => {
    notificationService.notify.mockRejectedValue(new Error('db down'));

    eventEmitter.emit(
      FAMILY_GROUP_MEMBER_INVITED_EVENT,
      new FamilyGroupMemberInvitedEvent(
        'recipient-1',
        'Admin',
        'group-1',
        'Grupo',
        'member-1',
        new Date(),
      ),
    );

    await new Promise((resolve) => setImmediate(resolve));

    expect(notificationService.notify).toHaveBeenCalled();
  });
});
