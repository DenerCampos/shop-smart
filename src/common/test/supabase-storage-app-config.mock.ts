import { AppConfig } from 'src/common/app-config/app.config';

export type SupabaseStorageConfigSlice = Pick<AppConfig, 'getSupabaseStorage'>;

export function createSupabaseStorageAppConfigMock(
  overrides: Partial<SupabaseStorageConfigSlice> = {},
): jest.Mocked<SupabaseStorageConfigSlice> {
  const fullStorage = {
    url: 'https://test.supabase.co',
    key: 'test-secret-key',
    bucket: 'shop-smart',
  };
  const mock: jest.Mocked<SupabaseStorageConfigSlice> = {
    getSupabaseStorage: jest.fn().mockReturnValue(fullStorage),
  };
  if (overrides.getSupabaseStorage !== undefined) {
    mock.getSupabaseStorage.mockImplementation(overrides.getSupabaseStorage);
  }
  return mock;
}
