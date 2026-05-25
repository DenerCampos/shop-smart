let supabaseMocks: {
  upload: jest.Mock;
  getPublicUrl: jest.Mock;
  remove: jest.Mock;
};

jest.mock('@supabase/supabase-js', () => {
  supabaseMocks = {
    upload: jest.fn(),
    getPublicUrl: jest.fn(),
    remove: jest.fn(),
  };

  const storageMock = {
    from: jest.fn().mockReturnValue({
      upload: (...args: unknown[]) => supabaseMocks.upload(...args),
      getPublicUrl: (...args: unknown[]) => supabaseMocks.getPublicUrl(...args),
      remove: (...args: unknown[]) => supabaseMocks.remove(...args),
    }),
  };

  return {
    createClient: jest.fn().mockReturnValue({ storage: storageMock }),
  };
});

import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { SupabaseStorageService } from '../supabase-storage.service';
import { AppConfig } from 'src/common/app-config/app.config';
import { createSupabaseStorageAppConfigMock } from 'src/common/test/supabase-storage-app-config.mock';

describe('SupabaseStorageService', () => {
  let service: SupabaseStorageService;

  beforeEach(async () => {
    jest.clearAllMocks();

    supabaseMocks.upload.mockResolvedValue({
      data: { path: 'recipe/foto.png' },
      error: null,
    });
    supabaseMocks.getPublicUrl.mockReturnValue({
      data: {
        publicUrl:
          'https://test.supabase.co/storage/v1/object/public/shop-smart/recipe/foto.png',
      },
    });
    supabaseMocks.remove.mockResolvedValue({ error: null });

    const appConfigMock = createSupabaseStorageAppConfigMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseStorageService,
        { provide: AppConfig, useValue: appConfigMock },
      ],
    }).compile();

    service = module.get(SupabaseStorageService);
  });

  describe('extractFileIdFromUrl', () => {
    it('extrai path de URL pública do Supabase', () => {
      expect(
        service.extractFileIdFromUrl(
          'https://test.supabase.co/storage/v1/object/public/shop-smart/recipe/foto.png',
        ),
      ).toBe('recipe/foto.png');
    });

    it('retorna null para URL legada do Google Drive', () => {
      expect(
        service.extractFileIdFromUrl(
          'https://lh3.googleusercontent.com/d/ABC_xyz-1',
        ),
      ).toBeNull();
    });
  });

  describe('uploadFile', () => {
    it('faz upload com subfolder e retorna URL pública', async () => {
      const result = await service.uploadFile(
        Buffer.from('x'),
        'foto.png',
        'image/png',
        'recipe',
      );

      expect(supabaseMocks.upload).toHaveBeenCalledWith(
        'recipe/foto.png',
        expect.any(Buffer),
        expect.objectContaining({ contentType: 'image/png', upsert: true }),
      );
      expect(result.webContentLink).toBe(
        'https://test.supabase.co/storage/v1/object/public/shop-smart/recipe/foto.png',
      );
    });

    it('lança quando config está incompleta', async () => {
      const badConfig = createSupabaseStorageAppConfigMock({
        getSupabaseStorage: jest.fn().mockReturnValue({ url: '', key: '', bucket: '' }),
      });

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SupabaseStorageService,
          { provide: AppConfig, useValue: badConfig },
        ],
      }).compile();

      const svc = module.get(SupabaseStorageService);

      await expect(
        svc.uploadFile(Buffer.from('a'), 'a.png', 'image/png'),
      ).rejects.toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('deleteFile', () => {
    it('chama storage.remove com o path recebido', async () => {
      await service.deleteFile('recipe/foto.png');
      expect(supabaseMocks.remove).toHaveBeenCalledWith(['recipe/foto.png']);
    });
  });
});
