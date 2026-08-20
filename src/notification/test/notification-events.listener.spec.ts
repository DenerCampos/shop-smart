import { EventEmitter } from 'events';
import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_EMITTER } from 'src/common/event-emitter/event-emitter.provider';
import { EmailService } from 'src/email/email.service';
import {
  FAMILY_GROUP_MEMBER_INVITED_EVENT,
  FamilyGroupMemberInvitedEvent,
} from 'src/family-group/events/family-group-member-invited.event';
import { User } from 'src/user/entities/user.entity';
import { UserCreatedEvent } from 'src/user/events/user-created.event';
import { NotificationEventsListener } from '../listeners/notification-events.listener';
import { NotificationService } from '../notification.service';
import { NOTIFICATION_CHANNELS } from '../types/notification-channel.type';
import { NOTIFICATION_TYPES } from '../types/notification-type.type';

describe('NotificationEventsListener', () => {
  let eventEmitter: EventEmitter;
  let notificationService: jest.Mocked<Pick<NotificationService, 'notify'>>;
  let emailService: jest.Mocked<Pick<EmailService, 'sendWelcome'>>;

  const flush = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(async () => {
    eventEmitter = new EventEmitter();
    notificationService = {
      notify: jest.fn().mockResolvedValue([]),
    };
    emailService = {
      sendWelcome: jest.fn().mockResolvedValue({ success: true }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationEventsListener,
        { provide: EVENT_EMITTER, useValue: eventEmitter },
        { provide: NotificationService, useValue: notificationService },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    module.get(NotificationEventsListener).onModuleInit();
  });

  it('convidado com conta recebe in-app e e-mail apontando para os convites', async () => {
    const createdAt = new Date('2026-08-07T12:00:00.000Z');

    eventEmitter.emit(
      FAMILY_GROUP_MEMBER_INVITED_EVENT,
      new FamilyGroupMemberInvitedEvent(
        'recipient-1',
        'convidado@test.com',
        'Admin Nome',
        'group-1',
        'Família Teste',
        'member-1',
        createdAt,
        'invite',
        'Convidado',
      ),
    );

    await flush();

    expect(notificationService.notify).toHaveBeenCalledWith({
      userId: 'recipient-1',
      recipientEmail: 'convidado@test.com',
      recipientName: 'Convidado',
      type: NOTIFICATION_TYPES.FAMILY_GROUP_INVITE,
      title: 'Convite para grupo familiar',
      body: 'Você foi convidado(a) para integrar o grupo "Família Teste".',
      actorName: 'Admin Nome',
      actionUrl: '/new-resources/family?tab=invitations',
      data: {
        groupId: 'group-1',
        memberId: 'member-1',
      },
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
    });
  });

  it('convidado sem conta recebe link de cadastro com o e-mail preenchido', async () => {
    eventEmitter.emit(
      FAMILY_GROUP_MEMBER_INVITED_EVENT,
      new FamilyGroupMemberInvitedEvent(
        null,
        'novo+convite@test.com',
        'Admin Nome',
        'group-1',
        'Família Teste',
        'member-1',
        new Date(),
      ),
    );

    await flush();

    expect(notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        recipientEmail: 'novo+convite@test.com',
        recipientName: null,
        actionUrl: '/register?email=novo%2Bconvite%40test.com',
        channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL],
      }),
    );
  });

  it('convite vinculado no cadastro não dispara e-mail', async () => {
    eventEmitter.emit(
      FAMILY_GROUP_MEMBER_INVITED_EVENT,
      new FamilyGroupMemberInvitedEvent(
        'recipient-1',
        'convidado@test.com',
        'Admin Nome',
        'group-1',
        'Família Teste',
        'member-1',
        new Date(),
        'signup_link',
      ),
    );

    await flush();

    expect(notificationService.notify).toHaveBeenCalledWith(
      expect.objectContaining({
        channels: [NOTIFICATION_CHANNELS.IN_APP],
      }),
    );
  });

  it('user.created envia e-mail de boas-vindas', async () => {
    eventEmitter.emit(
      'user.created',
      new UserCreatedEvent({
        id: 'user-1',
        name: 'Dener',
        email: 'dener@test.com',
      } as User),
    );

    await flush();

    expect(emailService.sendWelcome).toHaveBeenCalledWith({
      to: 'dener@test.com',
      name: 'Dener',
    });
  });

  it('falha no notify não propaga exceção do listener', async () => {
    notificationService.notify.mockRejectedValue(new Error('db down'));

    eventEmitter.emit(
      FAMILY_GROUP_MEMBER_INVITED_EVENT,
      new FamilyGroupMemberInvitedEvent(
        'recipient-1',
        'convidado@test.com',
        'Admin',
        'group-1',
        'Grupo',
        'member-1',
        new Date(),
      ),
    );

    await flush();

    expect(notificationService.notify).toHaveBeenCalled();
  });

  it('falha no e-mail de boas-vindas não propaga exceção', async () => {
    emailService.sendWelcome.mockRejectedValue(new Error('brevo down'));

    eventEmitter.emit(
      'user.created',
      new UserCreatedEvent({
        id: 'user-1',
        name: 'Dener',
        email: 'dener@test.com',
      } as User),
    );

    await flush();

    expect(emailService.sendWelcome).toHaveBeenCalled();
  });
});
