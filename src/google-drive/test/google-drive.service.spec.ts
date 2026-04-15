var gdriveMocks: {
  filesCreate: jest.Mock;
  filesDelete: jest.Mock;
  permissionsCreate: jest.Mock;
};

jest.mock('googleapis', () => {
  gdriveMocks = {
    filesCreate: jest.fn(),
    filesDelete: jest.fn().mockResolvedValue({}),
    permissionsCreate: jest.fn().mockResolvedValue({}),
  };
  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => ({
          setCredentials: jest.fn(),
        })),
      },
      drive: jest.fn().mockImplementation(() => ({
        files: {
          create: (...args: unknown[]) => gdriveMocks.filesCreate(...args),
          delete: (...args: unknown[]) => gdriveMocks.filesDelete(...args),
        },
        permissions: {
          create: (...args: unknown[]) =>
            gdriveMocks.permissionsCreate(...args),
        },
      })),
    },
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { GoogleDriveService } from '../google-drive.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { createGoogleDriveAppConfigMock } from 'src/common/test/google-drive-app-config.mock';

describe('GoogleDriveService', () => {
  let service: GoogleDriveService;

  beforeEach(async () => {
    jest.clearAllMocks();
    gdriveMocks.filesCreate.mockResolvedValue({
      data: {
        id: 'file-abc',
        name: 'foto.png',
        webViewLink: 'https://drive.google.com/file/d/file-abc/view',
        webContentLink: 'https://old-link',
      },
    });
    gdriveMocks.permissionsCreate.mockResolvedValue({});

    const appConfigMock = createGoogleDriveAppConfigMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleDriveService,
        { provide: AppConfig, useValue: appConfigMock },
      ],
    }).compile();

    service = module.get(GoogleDriveService);
  });

  describe('extractFileIdFromUrl', () => {
    it('extrai id do parâmetro id=', () => {
      expect(
        service.extractFileIdFromUrl(
          'https://drive.google.com/uc?export=view&id=ABC_xyz-1',
        ),
      ).toBe('ABC_xyz-1');
    });

    it('retorna null quando não há id', () => {
      expect(service.extractFileIdFromUrl('https://example.com')).toBeNull();
    });
  });

  describe('uploadFile', () => {
    it('cria arquivo, define permissão e retorna link direto', async () => {
      const result = await service.uploadFile(
        Buffer.from('x'),
        'nome.png',
        'image/png',
      );

      expect(gdriveMocks.filesCreate).toHaveBeenCalled();
      expect(gdriveMocks.permissionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          fileId: 'file-abc',
          requestBody: { role: 'reader', type: 'anyone' },
        }),
      );
      expect(result).toEqual({
        fileId: 'file-abc',
        fileName: 'foto.png',
        webViewLink: 'https://drive.google.com/file/d/file-abc/view',
        webContentLink: 'https://drive.google.com/uc?export=view&id=file-abc',
      });
    });

    it('lança quando config do Drive está incompleta', async () => {
      const badConfig = createGoogleDriveAppConfigMock({
        getGoogleDrive: jest.fn().mockReturnValue({
          clientId: '',
          clientSecret: '',
          refreshToken: '',
          folderId: '',
        }),
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GoogleDriveService,
          { provide: AppConfig, useValue: badConfig },
        ],
      }).compile();

      const svc = module.get(GoogleDriveService);

      await expect(
        svc.uploadFile(Buffer.from('a'), 'a.png', 'image/png'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('deleteFile', () => {
    it('delega ao drive.files.delete', async () => {
      await service.deleteFile('file-xyz');
      expect(gdriveMocks.filesDelete).toHaveBeenCalledWith({
        fileId: 'file-xyz',
      });
    });

    it('não propaga erro quando delete falha', async () => {
      gdriveMocks.filesDelete.mockRejectedValueOnce(new Error('api error'));
      await expect(service.deleteFile('bad')).resolves.toBeUndefined();
    });
  });
});
