import { CouponReaderService } from 'src/coupon-reader/couponReader.service';
import { GoogleDriveService } from 'src/google-drive/google-drive.service';
import { User } from 'src/user/entities/user.entity';
import {
  CouponTextResult,
  ShoppingListItemTextAiResult,
  ShoppingListItemTextAiResultArray,
} from 'src/text-recognition/types/textRecognitionType';
import { IImageRecognitionProvider } from 'src/image-recognition/providers/interfaces/image-recognition-provider.interface';
import { ITextRecognitionProvider } from 'src/text-recognition/providers/interfaces/text-recognition-provider.interface';
import { IAudioRecognitionProvider } from 'src/audio-recognition/providers/interfaces/audio-recognition-provider.interface';

const quotaInfo = () =>
  Promise.resolve({
    requestCount: 0,
    dailyLimit: 100,
    remaining: 100,
  });

/** Provedor falso — sem chamadas ao Gemini (@google/generative-ai). */
export const mockImageRecognitionProviders: IImageRecognitionProvider[] = [
  {
    name: 'gemini',
    analyze: async () => ({
      name: 'E2e expense',
      value: 1,
      repeat: false,
      items: [],
      store: { name: 'E2e store' },
      payment: { method: 'Cash' },
      date: new Date('2024-01-15'),
      confidence: 1,
      provider: 'gemini',
    }),
    isAvailable: async () => true,
    getQuotaInfo: quotaInfo,
  },
];

const baseShoppingItem = (name: string): ShoppingListItemTextAiResult => ({
  name,
  quantity: 1,
  unit: 'un',
  group: { name: 'Alimentação', isNew: false },
  confidence: 1,
  provider: 'gemini-text',
});

export const mockTextRecognitionProviders: ITextRecognitionProvider[] = [
  {
    name: 'gemini-text',
    analyze: async (text: string) =>
      baseShoppingItem(text.trim() || 'E2e item'),
    analyzeBulk: async (
      text: string,
    ): Promise<ShoppingListItemTextAiResultArray> => {
      const names = text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const items =
        names.length > 0
          ? names.map((n) => baseShoppingItem(n))
          : [baseShoppingItem('E2e item')];
      return { items };
    },
    parseCoupon: async (): Promise<CouponTextResult> => ({
      name: 'E2e cupom',
      value: 10,
      date: '2024-01-15',
      repeat: false,
      items: [],
      store: { name: 'E2e loja' },
      payment: { name: 'Dinheiro' },
      confidence: 1,
      provider: 'gemini-text',
    }),
    isAvailable: async () => true,
    getQuotaInfo: quotaInfo,
  },
];

export const mockAudioRecognitionProviders: IAudioRecognitionProvider[] = [
  {
    name: 'gemini-audio',
    analyze: async () => ({
      name: 'E2e audio',
      value: 1,
      repeat: false,
      items: [],
      store: { name: 'E2e store' },
      payment: { name: 'Cash' },
      date: new Date('2024-01-15'),
      confidence: 1,
      provider: 'gemini-audio',
    }),
    isAvailable: async () => true,
    getQuotaInfo: quotaInfo,
  },
];

export function mockCouponReaderService(): Pick<CouponReaderService, 'read'> {
  const result: CouponTextResult & { uri: string } = {
    name: 'E2e loja',
    value: 99.9,
    date: '2024-06-01',
    repeat: false,
    items: [],
    store: { name: 'E2e loja' },
    payment: { name: 'Pix' },
    confidence: 1,
    provider: 'e2e-mock-coupon',
    uri: 'https://example.com/nfe',
  };
  return {
    read: jest.fn(async (_url: string, _user: User) => ({ ...result })),
  };
}

export function mockGoogleDriveService(): Pick<
  GoogleDriveService,
  'uploadFile' | 'deleteFile' | 'extractFileIdFromUrl'
> {
  return {
    uploadFile: jest.fn(async () => ({
      fileId: 'e2e-drive-id',
      fileName: 'profile.png',
      webViewLink: 'https://example.com/view',
      webContentLink: 'https://drive.google.com/uc?export=view&id=e2e-drive-id',
    })),
    deleteFile: jest.fn(async () => undefined),
    extractFileIdFromUrl: jest.fn(() => 'e2e-drive-id'),
  };
}
