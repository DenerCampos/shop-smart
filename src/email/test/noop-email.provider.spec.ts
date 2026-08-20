import { AppConfig } from 'src/common/app-config/app.config';
import { createAppConfigMock } from 'src/common/test/app-config.mock';
import { logJson } from 'src/common/logging/log-event.util';
import { NoopEmailProvider } from '../providers/noop-email.provider';

jest.mock('src/common/logging/log-event.util', () => ({
  logJson: jest.fn(),
}));

describe('NoopEmailProvider', () => {
  const input = {
    to: 'dener@test.com',
    subject: 'Redefinição de senha - Super Family Quest',
    html: '<p>secret</p>',
    text: 'http://localhost:5173/reset-password?token=abc123',
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('não envia o corpo do e-mail (nem o token) para o logJson', async () => {
    const appConfig = createAppConfigMock({
      isDevelopment: jest.fn().mockReturnValue(false),
    });
    const provider = new NoopEmailProvider(appConfig as unknown as AppConfig);

    await provider.sendEmail(input);

    expect(logJson).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        event: 'email_noop_send',
        to: input.to,
        subject: input.subject,
      }),
    );
    const payload = (logJson as jest.Mock).mock.calls[0][1] as Record<
      string,
      unknown
    >;
    expect(payload).not.toHaveProperty('text');
    expect(JSON.stringify(payload)).not.toContain('token=abc123');
  });
});
