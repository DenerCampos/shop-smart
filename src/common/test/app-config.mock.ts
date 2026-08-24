import { AppConfig } from 'src/common/app-config/app.config';

type MockedAppConfigKeys =
  | 'getBaseUrl'
  | 'getSaltEncryption'
  | 'getFrontendUrl'
  | 'isDevelopment'
  | 'getApi'
  | 'getDefaultRecognitionProvider'
  | 'getEmail'
  | 'getPasswordResetTokenTtlMinutes';

/** Valores seguros para testes (sem secrets reais). */
export function createAppConfigMock(
  overrides: Partial<Record<keyof AppConfig, unknown>> = {},
): jest.Mocked<Pick<AppConfig, MockedAppConfigKeys>> {
  const mock = {
    getBaseUrl: jest.fn().mockReturnValue('http://localhost:3000'),
    getSaltEncryption: jest.fn().mockReturnValue(4),
    getFrontendUrl: jest.fn().mockReturnValue('http://localhost:5173'),
    isDevelopment: jest.fn().mockReturnValue(true),
    getApi: jest.fn().mockReturnValue({ host: 'localhost', port: 3000 }),
    getDefaultRecognitionProvider: jest.fn().mockReturnValue('gemini'),
    getEmail: jest.fn().mockReturnValue({
      provider: 'noop',
      apiKey: '',
      from: 'test@local',
      fromName: 'Super Family Quest',
    }),
    getPasswordResetTokenTtlMinutes: jest.fn().mockReturnValue(30),
  };

  return { ...mock, ...overrides } as jest.Mocked<
    Pick<AppConfig, MockedAppConfigKeys>
  >;
}
