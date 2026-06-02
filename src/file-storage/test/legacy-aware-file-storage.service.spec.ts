import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from 'src/common/app-config/app.config';
import { LegacyAwareFileStorageService } from '../legacy-aware-file-storage.service';
import { SupabaseStorageService } from 'src/supabase-storage/supabase-storage.service';
import { GoogleDriveService } from 'src/google-drive/google-drive.service';

jest.mock('src/supabase-storage/supabase-storage.service');
jest.mock('src/google-drive/google-drive.service');

describe('LegacyAwareFileStorageService', () => {
  let service: LegacyAwareFileStorageService;
  let appConfig: jest.Mocked<Pick<AppConfig, 'getFileStorageProvider'>>;

  const supabaseMock = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    extractFileIdFromUrl: jest.fn(),
  };

  const googleDriveMock = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
    extractFileIdFromUrl: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (SupabaseStorageService as jest.Mock).mockImplementation(
      () => supabaseMock,
    );
    (GoogleDriveService as jest.Mock).mockImplementation(() => googleDriveMock);

    appConfig = {
      getFileStorageProvider: jest.fn().mockReturnValue('supabase'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegacyAwareFileStorageService,
        { provide: AppConfig, useValue: appConfig },
      ],
    }).compile();

    service = module.get(LegacyAwareFileStorageService);
  });

  it('uploadFile delega ao provider principal (Supabase)', async () => {
    supabaseMock.uploadFile.mockResolvedValue({
      fileId: 'profile/x.png',
      fileName: 'x.png',
      webViewLink: 'https://example.com/x.png',
      webContentLink: 'https://example.com/x.png',
    });

    await service.uploadFile(Buffer.from('a'), 'x.png', 'image/png', 'profile');

    expect(SupabaseStorageService).toHaveBeenCalledTimes(1);
    expect(GoogleDriveService).not.toHaveBeenCalled();
    expect(supabaseMock.uploadFile).toHaveBeenCalled();
  });

  it('extractFileIdFromUrl usa fallback do Google Drive com provider supabase', () => {
    supabaseMock.extractFileIdFromUrl.mockReturnValue(null);

    const id = service.extractFileIdFromUrl(
      'https://lh3.googleusercontent.com/d/legacy-file-id',
    );

    expect(id).toBe('legacy-file-id');
    expect(GoogleDriveService).not.toHaveBeenCalled();
  });

  it('deleteFile remove arquivo legado do Drive quando id parece fileId do Drive', async () => {
    googleDriveMock.deleteFile.mockResolvedValue(undefined);

    await service.deleteFile('legacy-file-id');

    expect(GoogleDriveService).toHaveBeenCalledTimes(1);
    expect(googleDriveMock.deleteFile).toHaveBeenCalledWith('legacy-file-id');
    expect(supabaseMock.deleteFile).not.toHaveBeenCalled();
  });

  it('deleteFile delega path Supabase ao provider principal', async () => {
    supabaseMock.deleteFile.mockResolvedValue(undefined);

    await service.deleteFile('profile/new-photo.png');

    expect(SupabaseStorageService).toHaveBeenCalledTimes(1);
    expect(supabaseMock.deleteFile).toHaveBeenCalledWith(
      'profile/new-photo.png',
    );
    expect(GoogleDriveService).not.toHaveBeenCalled();
  });

  it('com provider google-drive não instancia Supabase', async () => {
    appConfig.getFileStorageProvider.mockReturnValue('google-drive');
    googleDriveMock.uploadFile.mockResolvedValue({
      fileId: 'drive-id',
      fileName: 'x.png',
      webViewLink: 'https://example.com/view',
      webContentLink: 'https://lh3.googleusercontent.com/d/drive-id',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LegacyAwareFileStorageService,
        { provide: AppConfig, useValue: appConfig },
      ],
    }).compile();

    const driveService = module.get(LegacyAwareFileStorageService);
    await driveService.uploadFile(Buffer.from('a'), 'x.png', 'image/png');

    expect(GoogleDriveService).toHaveBeenCalledTimes(1);
    expect(SupabaseStorageService).not.toHaveBeenCalled();
  });
});
