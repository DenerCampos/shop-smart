import { AppConfig } from 'src/common/app-config/app.config';

export type GoogleDriveConfigSlice = Pick<
  AppConfig,
  'getGoogleDrive' | 'getGoogleDriveRateLimit'
>;

export function createGoogleDriveAppConfigMock(
  overrides: Partial<GoogleDriveConfigSlice> = {},
): jest.Mocked<GoogleDriveConfigSlice> {
  const fullDrive = {
    clientId: 'test-client-id',
    clientSecret: 'test-secret',
    refreshToken: 'test-refresh',
    folderId: 'folder-123',
  };
  const mock: jest.Mocked<GoogleDriveConfigSlice> = {
    getGoogleDrive: jest.fn().mockReturnValue(fullDrive),
    getGoogleDriveRateLimit: jest.fn().mockReturnValue(50),
  };
  if (overrides.getGoogleDrive !== undefined) {
    mock.getGoogleDrive.mockImplementation(overrides.getGoogleDrive);
  }
  if (overrides.getGoogleDriveRateLimit !== undefined) {
    mock.getGoogleDriveRateLimit.mockImplementation(
      overrides.getGoogleDriveRateLimit,
    );
  }
  return mock;
}
