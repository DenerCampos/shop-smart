const generateContent = jest.fn();

jest.mock('@google/generative-ai', () => ({
  __esModule: true,
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: () => ({ generateContent }),
  })),
}));

import { GeminiTextProvider } from '../providers/gemini/gemini-text.provider';
import { AppConfig } from '../../common/app-config/app.config';
import { ApiQuotaService } from '../../common/ai-quota/services/apiQuota.service';
import { AiCallTelemetryService } from '../../common/logging/ai-call-telemetry.service';
import { AiProviderException } from '../../common/ai-provider/ai-provider.exception';

describe('GeminiTextProvider.parseCoupon', () => {
  let provider: GeminiTextProvider;

  const mockResponse = (payload: Record<string, unknown>) => {
    generateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(payload) },
    });
  };

  const couponPayload = (overrides: Record<string, unknown> = {}) => ({
    name: 'Mercado Bom Preço',
    value: 42.5,
    date: '2026-08-13',
    repeat: false,
    items: [
      { code: '1', name: 'Arroz', group: { name: 'Alimentação' } },
      { code: '2', name: 'Feijão', group: { name: 'Alimentação' } },
      { code: '3', name: 'Detergente', group: { name: 'Limpeza' } },
    ],
    store: { name: 'Mercado Bom Preço' },
    payment: { name: 'Pix' },
    ...overrides,
  });

  beforeEach(() => {
    generateContent.mockReset();

    const appConfig = {
      getGoogleApiKey: jest.fn().mockReturnValue('fake-key'),
      getGeminiTextDailyLimit: jest.fn().mockReturnValue(100),
    } as unknown as AppConfig;

    const apiQuotaService = {
      checkAndIncrementQuota: jest.fn().mockResolvedValue(undefined),
    } as unknown as ApiQuotaService;

    const telemetry = {
      measure: <T>(_f: string, _p: string, fn: () => Promise<T>) => fn(),
    } as unknown as AiCallTelemetryService;

    provider = new GeminiTextProvider(appConfig, apiQuotaService, telemetry);
  });

  it('mantém o nome quando a IA identifica o estabelecimento', async () => {
    mockResponse(couponPayload());

    const result = await provider.parseCoupon('texto do cupom');

    expect(result.name).toBe('Mercado Bom Preço');
    expect(result.store.name).toBe('Mercado Bom Preço');
    expect(result.isNameFallback).toBe(false);
    expect(result.confidence).toBe(0.9);
  });

  it('usa o nome da loja quando apenas name vem vazio', async () => {
    mockResponse(couponPayload({ name: '   ' }));

    const result = await provider.parseCoupon('texto do cupom');

    expect(result.name).toBe('Mercado Bom Preço');
    expect(result.isNameFallback).toBe(false);
  });

  it('gera nome pela categoria predominante quando a IA não acha o estabelecimento', async () => {
    mockResponse(couponPayload({ name: '', store: { name: null } }));

    const result = await provider.parseCoupon('texto do cupom');

    expect(result.name).toBe('Compra de Alimentação');
    expect(result.store.name).toBe('Compra de Alimentação');
    expect(result.isNameFallback).toBe(true);
    expect(result.confidence).toBe(0.7);
  });

  it('gera nome genérico quando não há estabelecimento nem categorias', async () => {
    mockResponse(
      couponPayload({
        name: null,
        store: undefined,
        items: [{ code: '1', name: 'Arroz' }],
      }),
    );

    const result = await provider.parseCoupon('texto do cupom');

    expect(result.name).toBe('Compra não identificada');
    expect(result.isNameFallback).toBe(true);
  });

  it('usa nome genérico quando a categoria predominante não está na allowlist', async () => {
    mockResponse(
      couponPayload({
        name: '',
        store: { name: '' },
        items: [{ code: '1', name: 'Item', group: { name: 'Mercado Extra' } }],
      }),
    );

    const result = await provider.parseCoupon('texto do cupom');

    expect(result.name).toBe('Compra não identificada');
    expect(result.isNameFallback).toBe(true);
  });

  it('usa categoria do usuário quando está na lista de grupos', async () => {
    mockResponse(
      couponPayload({
        name: '',
        store: { name: '' },
        items: [{ code: '1', name: 'Remédio', group: { name: 'Farmácia' } }],
      }),
    );

    const result = await provider.parseCoupon('texto do cupom', {
      groups: ['Farmácia', 'Alimentação'],
    });

    expect(result.name).toBe('Compra de Farmácia');
    expect(result.isNameFallback).toBe(true);
  });

  it('lança quando o valor total não é numérico', async () => {
    mockResponse(couponPayload({ value: '42.5' }));

    await expect(provider.parseCoupon('texto do cupom')).rejects.toBeInstanceOf(
      AiProviderException,
    );
  });

  it('lança quando items não é um array', async () => {
    mockResponse(couponPayload({ items: null }));

    await expect(provider.parseCoupon('texto do cupom')).rejects.toBeInstanceOf(
      AiProviderException,
    );
  });

  it('lança AI_PROVIDER_ERROR quando o modelo falha ao responder', async () => {
    generateContent.mockRejectedValue(new Error('gemini timeout'));

    await expect(provider.parseCoupon('texto do cupom')).rejects.toBeInstanceOf(
      AiProviderException,
    );
  });
});

describe('GeminiTextProvider.generateHealthOverview', () => {
  let provider: GeminiTextProvider;

  beforeEach(() => {
    generateContent.mockReset();

    const appConfig = {
      getGoogleApiKey: jest.fn().mockReturnValue('fake-key'),
      getGeminiTextDailyLimit: jest.fn().mockReturnValue(100),
    } as unknown as AppConfig;

    const apiQuotaService = {
      checkAndIncrementQuota: jest.fn().mockResolvedValue(undefined),
    } as unknown as ApiQuotaService;

    const telemetry = {
      measure: <T>(_f: string, _p: string, fn: () => Promise<T>) => fn(),
    } as unknown as AiCallTelemetryService;

    provider = new GeminiTextProvider(appConfig, apiQuotaService, telemetry);
  });

  it('lança AI_PROVIDER_ERROR quando a resposta do modelo está vazia', async () => {
    generateContent.mockResolvedValue({
      response: { text: () => '   ' },
    });

    await expect(
      provider.generateHealthOverview('exames do paciente'),
    ).rejects.toBeInstanceOf(AiProviderException);
  });
});
