import { EmailService } from 'src/email/email.service';
import { EmailChannel } from '../channels/email.channel';
import { NOTIFICATION_TYPES } from '../types/notification-type.type';
import { NotificationPayload } from '../types/notify-input.type';

describe('EmailChannel', () => {
  let emailService: jest.Mocked<Pick<EmailService, 'sendNotification'>>;
  let channel: EmailChannel;

  const payload = (
    overrides: Partial<NotificationPayload> = {},
  ): NotificationPayload => ({
    userId: 'user-1',
    recipientEmail: 'convidado@test.com',
    recipientName: 'Convidado',
    type: NOTIFICATION_TYPES.FAMILY_GROUP_INVITE,
    title: 'Convite para grupo familiar',
    body: 'Você foi convidado.',
    actorName: 'Admin',
    actionUrl: '/new-resources/family?tab=invitations',
    data: null,
    ...overrides,
  });

  beforeEach(() => {
    emailService = {
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
    };
    channel = new EmailChannel(emailService as unknown as EmailService);
  });

  it('envia com os dados da notificação', async () => {
    const result = await channel.send(payload());

    expect(emailService.sendNotification).toHaveBeenCalledWith({
      to: 'convidado@test.com',
      toName: 'Convidado',
      title: 'Convite para grupo familiar',
      body: 'Você foi convidado.',
      actorName: 'Admin',
      actionUrl: '/new-resources/family?tab=invitations',
    });
    expect(result).toEqual({ channel: 'email', success: true });
  });

  it('marca como skipped quando não há e-mail do destinatário', async () => {
    const result = await channel.send(payload({ recipientEmail: null }));

    expect(emailService.sendNotification).not.toHaveBeenCalled();
    expect(result).toEqual({ channel: 'email', success: true, skipped: true });
  });

  it('propaga erro do envio como falha do canal', async () => {
    emailService.sendNotification.mockResolvedValue({
      success: false,
      error: 'brevo_http_400',
    });

    const result = await channel.send(payload());

    expect(result).toEqual({
      channel: 'email',
      success: false,
      error: 'brevo_http_400',
    });
  });
});
