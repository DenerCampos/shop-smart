import { AppConfig } from 'src/common/app-config/app.config';

/** Valores seguros para testes (sem secrets reais). */
export function createAppConfigMock(
  overrides: Partial<Record<keyof AppConfig, unknown>> = {},
): jest.Mocked<Pick<AppConfig, 'getBaseUrl' | 'getSaltEncryption' | 'getFrontendUrl' | 'isDevelopment' | 'getApi' | 'getDefaultRecognitionProvider'>> {
  const mock = {
    getBaseUrl: jest.fn().mockReturnValue('http://localhost:3000'),
    getSaltEncryption: jest.fn().mockReturnValue(4),
    getFrontendUrl: jest.fn().mockReturnValue('http://localhost:5173'),
    isDevelopment: jest.fn().mockReturnValue(true),
    getApi: jest.fn().mockReturnValue({ host: 'localhost', port: 3000 }),
    getDefaultRecognitionProvider: jest.fn().mockReturnValue('gemini'),
  };
  return { ...mock, ...overrides } as jest.Mocked<
    Pick<
      AppConfig,
      | 'getBaseUrl'
      | 'getSaltEncryption'
      | 'getFrontendUrl'
      | 'isDevelopment'
      | 'getApi'
      | 'getDefaultRecognitionProvider'
    >
  >;
}
