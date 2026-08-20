import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from 'src/common/app-config/app.config';
import { createAppConfigMock } from 'src/common/test/app-config.mock';
import { EMAIL_PROVIDER } from '../email.constants';
import { EmailService } from '../email.service';
import {
  IEmailProvider,
  SendEmailInput,
} from '../interfaces/email-provider.interface';

describe('EmailService', () => {
  let service: EmailService;
  let provider: jest.Mocked<IEmailProvider>;

  const lastSent = (): SendEmailInput => provider.sendEmail.mock.calls[0][0];

  beforeEach(async () => {
    provider = {
      name: 'noop',
      sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'x' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: EMAIL_PROVIDER, useValue: provider },
        { provide: AppConfig, useValue: createAppConfigMock() },
      ],
    }).compile();

    service = module.get(EmailService);
  });

  describe('sendPasswordReset', () => {
    it('monta o link de redefinição com o token na query', async () => {
      await service.sendPasswordReset({
        to: 'dener@test.com',
        name: 'Dener',
        token: 'abc123',
      });

      const sent = lastSent();
      expect(sent.to).toBe('dener@test.com');
      expect(sent.html).toContain(
        'http://localhost:5173/reset-password?token=abc123',
      );
      expect(sent.text).toContain(
        'http://localhost:5173/reset-password?token=abc123',
      );
    });

    it('informa a validade do link', async () => {
      await service.sendPasswordReset({
        to: 'dener@test.com',
        name: 'Dener',
        token: 'abc123',
      });

      expect(lastSent().text).toContain('30 minutos');
    });
  });

  describe('sendNotification', () => {
    it('transforma actionUrl relativa em absoluta', async () => {
      await service.sendNotification({
        to: 'dener@test.com',
        title: 'Convite',
        body: 'Você foi convidado.',
        actionUrl: '/new-resources/family?tab=invitations',
      });

      expect(lastSent().text).toContain(
        'http://localhost:5173/new-resources/family?tab=invitations',
      );
    });

    it('preserva actionUrl que já é absoluta', async () => {
      await service.sendNotification({
        to: 'dener@test.com',
        title: 'Convite',
        body: 'Você foi convidado.',
        actionUrl: 'https://exemplo.com/x',
      });

      expect(lastSent().text).toContain('https://exemplo.com/x');
    });

    it('funciona sem actionUrl', async () => {
      const result = await service.sendNotification({
        to: 'dener@test.com',
        title: 'Aviso',
        body: 'Corpo.',
        actionUrl: null,
      });

      expect(result.success).toBe(true);
    });
  });

  it('não propaga exceção quando o provider quebra', async () => {
    provider.sendEmail.mockRejectedValue(new Error('brevo fora do ar'));

    const result = await service.sendWelcome({
      to: 'dener@test.com',
      name: 'Dener',
    });

    expect(result).toEqual({ success: false, error: 'brevo fora do ar' });
  });

  it('repassa falha reportada pelo provider', async () => {
    provider.sendEmail.mockResolvedValue({
      success: false,
      error: 'brevo_http_401',
    });

    const result = await service.sendWelcome({
      to: 'dener@test.com',
      name: 'Dener',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('brevo_http_401');
  });
});
