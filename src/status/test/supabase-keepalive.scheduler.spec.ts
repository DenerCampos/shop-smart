import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from 'src/common/app-config/app.config';
import { SupabaseStorageService } from 'src/supabase-storage/supabase-storage.service';
import {
  SUPABASE_KEEPALIVE_INTERVAL_MS,
  SupabaseKeepaliveScheduler,
} from '../supabase-keepalive.scheduler';

const completeSupabaseConfig = {
  url: 'https://example.supabase.co',
  key: 'secret',
  bucket: 'shop-smart',
};

describe('SupabaseKeepaliveScheduler', () => {
  let scheduler: SupabaseKeepaliveScheduler;
  let ping: jest.Mock;
  let getFileStorageProvider: jest.Mock;
  let getSupabaseStorage: jest.Mock;

  beforeEach(async () => {
    ping = jest.fn().mockResolvedValue(undefined);
    getFileStorageProvider = jest.fn().mockReturnValue('supabase');
    getSupabaseStorage = jest.fn().mockReturnValue(completeSupabaseConfig);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseKeepaliveScheduler,
        {
          provide: SupabaseStorageService,
          useValue: { ping },
        },
        {
          provide: AppConfig,
          useValue: { getFileStorageProvider, getSupabaseStorage },
        },
      ],
    }).compile();

    scheduler = module.get(SupabaseKeepaliveScheduler);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shouldPing retorna true quando nunca houve sucesso', () => {
    expect(scheduler.shouldPing(Date.now())).toBe(true);
  });

  it('pings no primeiro keepAlive', async () => {
    await scheduler.keepAlive();
    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('ignora keepAlive se o último sucesso foi recente', async () => {
    const t0 = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(t0);

    await scheduler.keepAlive();
    ping.mockClear();

    jest
      .spyOn(Date, 'now')
      .mockReturnValue(t0 + SUPABASE_KEEPALIVE_INTERVAL_MS - 1);
    await scheduler.keepAlive();

    expect(ping).not.toHaveBeenCalled();
  });

  it('pings de novo após 5 dias desde o último sucesso', async () => {
    const t0 = 1_700_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(t0);

    await scheduler.keepAlive();
    ping.mockClear();

    jest
      .spyOn(Date, 'now')
      .mockReturnValue(t0 + SUPABASE_KEEPALIVE_INTERVAL_MS);
    await scheduler.keepAlive();

    expect(ping).toHaveBeenCalledTimes(1);
  });

  it('não chama ping quando o provider não é supabase', async () => {
    getFileStorageProvider.mockReturnValue('google-drive');

    await scheduler.keepAlive();

    expect(ping).not.toHaveBeenCalled();
  });

  it.each(['url', 'key', 'bucket'] as const)(
    'não chama ping quando %s está vazio',
    async (field) => {
      getSupabaseStorage.mockReturnValue({
        ...completeSupabaseConfig,
        [field]: '  ',
      });

      await scheduler.keepAlive();

      expect(ping).not.toHaveBeenCalled();
    },
  );

  it('após falha, tenta de novo no próximo keepAlive', async () => {
    ping.mockRejectedValueOnce(new Error('storage down'));
    await scheduler.keepAlive();
    expect(ping).toHaveBeenCalledTimes(1);

    ping.mockResolvedValue(undefined);
    await scheduler.keepAlive();
    expect(ping).toHaveBeenCalledTimes(2);
  });
});
