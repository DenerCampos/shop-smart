let gdriveMocks: {
  filesCreate: jest.Mock;
  filesList: jest.Mock;
  filesDelete: jest.Mock;
  permissionsCreate: jest.Mock;
};

jest.mock('googleapis', () => {
  gdriveMocks = {
    filesCreate: jest.fn(),
    filesList: jest.fn().mockResolvedValue({ data: { files: [] } }),
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
          list: (...args: unknown[]) => gdriveMocks.filesList(...args),
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
    gdriveMocks.filesList.mockResolvedValue({ data: { files: [] } });
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
    it('extrai id do formato lh3.googleusercontent.com/d/<id>', () => {
      expect(
        service.extractFileIdFromUrl(
          'https://lh3.googleusercontent.com/d/ABC_xyz-1',
        ),
      ).toBe('ABC_xyz-1');
    });

    it('extrai id do formato legado uc?export=view&id=<id>', () => {
      expect(
        service.extractFileIdFromUrl(
          'https://drive.google.com/uc?export=view&id=ABC_xyz-1',
        ),
      ).toBe('ABC_xyz-1');
    });

    it('retorna null quando não há id reconhecível', () => {
      expect(service.extractFileIdFromUrl('https://example.com')).toBeNull();
    });
  });

  describe('uploadFile', () => {
    it('cria arquivo sem subpasta, define permissão e retorna link direto', async () => {
      const result = await service.uploadFile(
        Buffer.from('x'),
        'nome.png',
        'image/png',
      );

      expect(gdriveMocks.filesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({ parents: ['folder-123'] }),
        }),
      );
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
        webContentLink: 'https://lh3.googleusercontent.com/d/file-abc',
      });
    });

    it('cria subpasta quando não existe e faz upload nela', async () => {
      gdriveMocks.filesList.mockResolvedValueOnce({ data: { files: [] } });
      gdriveMocks.filesCreate
        .mockResolvedValueOnce({ data: { id: 'subfolder-id' } })
        .mockResolvedValueOnce({
          data: {
            id: 'file-abc',
            name: 'foto.png',
            webViewLink: 'https://drive.google.com/file/d/file-abc/view',
          },
        });

      await service.uploadFile(Buffer.from('x'), 'foto.png', 'image/png', 'chore');

      const [folderCreate, fileCreate] = gdriveMocks.filesCreate.mock.calls;
      expect(folderCreate[0].requestBody).toMatchObject({
        name: 'chore',
        mimeType: 'application/vnd.google-apps.folder',
        parents: ['folder-123'],
      });
      expect(fileCreate[0].requestBody).toMatchObject({
        parents: ['subfolder-id'],
      });
    });

    it('reutiliza subpasta existente sem criar nova', async () => {
      gdriveMocks.filesList.mockResolvedValueOnce({
        data: { files: [{ id: 'existing-subfolder' }] },
      });

      await service.uploadFile(Buffer.from('x'), 'foto.png', 'image/png', 'profile');

      const folderCreateCall = gdriveMocks.filesCreate.mock.calls.find(
        (c) =>
          c[0]?.requestBody?.mimeType === 'application/vnd.google-apps.folder',
      );
      expect(folderCreateCall).toBeUndefined();
      expect(gdriveMocks.filesCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          requestBody: expect.objectContaining({ parents: ['existing-subfolder'] }),
        }),
      );
    });

    it('cacheia ID da subpasta na segunda chamada', async () => {
      gdriveMocks.filesList.mockResolvedValueOnce({ data: { files: [] } });
      gdriveMocks.filesCreate
        .mockResolvedValueOnce({ data: { id: 'subfolder-id' } })
        .mockResolvedValue({
          data: { id: 'file-abc', name: 'f.png', webViewLink: '' },
        });

      await service.uploadFile(Buffer.from('x'), 'f.png', 'image/png', 'chore');
      await service.uploadFile(Buffer.from('y'), 'g.png', 'image/png', 'chore');

      // filesList só deve ter sido chamado uma vez (cache hit na segunda)
      expect(gdriveMocks.filesList).toHaveBeenCalledTimes(1);
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
