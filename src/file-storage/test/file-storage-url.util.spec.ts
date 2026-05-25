import {
  extractGoogleDriveFileIdFromUrl,
  extractSupabaseStoragePathFromUrl,
  looksLikeGoogleDriveFileId,
} from '../utils/file-storage-url.util';

describe('file-storage-url.util', () => {
  describe('extractSupabaseStoragePathFromUrl', () => {
    it('extrai path de URL pública', () => {
      expect(
        extractSupabaseStoragePathFromUrl(
          'https://test.supabase.co/storage/v1/object/public/shop-smart/profile/foto.png',
        ),
      ).toBe('profile/foto.png');
    });

    it('decodifica segmentos URL-encoded', () => {
      expect(
        extractSupabaseStoragePathFromUrl(
          'https://test.supabase.co/storage/v1/object/public/shop-smart/profile/foto%201.png',
        ),
      ).toBe('profile/foto 1.png');
    });
  });

  describe('extractGoogleDriveFileIdFromUrl', () => {
    it('extrai id do formato lh3', () => {
      expect(
        extractGoogleDriveFileIdFromUrl(
          'https://lh3.googleusercontent.com/d/abc-123_xyz',
        ),
      ).toBe('abc-123_xyz');
    });

    it('extrai id do formato query id=', () => {
      expect(
        extractGoogleDriveFileIdFromUrl(
          'https://drive.google.com/uc?export=view&id=old-id',
        ),
      ).toBe('old-id');
    });
  });

  describe('looksLikeGoogleDriveFileId', () => {
    it('identifica id do Drive', () => {
      expect(looksLikeGoogleDriveFileId('abc-123_xyz')).toBe(true);
    });

    it('rejeita path Supabase com subpasta', () => {
      expect(looksLikeGoogleDriveFileId('profile/foto.png')).toBe(false);
    });
  });
});
