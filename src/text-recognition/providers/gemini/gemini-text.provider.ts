import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { AppConfig } from 'src/common/app-config/app.config';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import {
  CouponTextResult,
  ExtractedExamData,
  ExtractedPrescriptionData,
  ShoppingListItemTextAiResult,
  ShoppingListItemTextAiResultArray,
} from '../../types/textRecognitionType';
import { AiProviderException } from 'src/common/ai-provider/ai-provider.exception';
import { measureThenWrapAiCall } from 'src/common/ai-provider/wrap-ai-call-error';
import {
  CouponParseOptions,
  ITextRecognitionProvider,
  TextRecognitionAnalyzeOptions,
} from '../interfaces/text-recognition-provider.interface';
import { AiCallTelemetryService } from 'src/common/logging/ai-call-telemetry.service';
import { buildHealthExamTextExtractionPrompt } from 'src/common/prompts/health-exam-extraction.prompt';
import { buildHealthOverviewPrompt } from 'src/common/prompts/health-overview.prompt';
import { buildPrescriptionTextExtractionPrompt } from 'src/common/prompts/prescription-extraction.prompt';
import { buildCouponTextPrompt } from 'src/common/prompts/coupon-text.prompt';
import {
  buildShoppingListBulkPrompt,
  buildShoppingListItemPrompt,
} from 'src/common/prompts/shopping-list.prompt';
import {
  DEFAULT_COUPON_GROUP_NAMES,
  buildFallbackCouponStoreName,
  pickCouponStoreName,
} from '../../utils/coupon-store-name.util';

/** Alinhado a shopping-list-item-unit (evita import do módulo shopping-list). */
const ALLOWED_UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pack', 'dz'] as const;
type AllowedUnit = (typeof ALLOWED_UNITS)[number];

@Injectable()
export class GeminiTextProvider implements ITextRecognitionProvider {
  name = 'gemini-text';
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel | null;
  private readonly dailyLimit: number;

  constructor(
    private readonly appConfig: AppConfig,
    private readonly apiQuotaService: ApiQuotaService,
    private readonly aiCallTelemetry: AiCallTelemetryService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.appConfig.getGoogleApiKey());
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.dailyLimit = this.appConfig.getGeminiTextDailyLimit();
  }

  private cleanModelJson(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleaned.trim();
  }

  private coerceUnit(raw: unknown): AllowedUnit {
    const s =
      typeof raw === 'string' || typeof raw === 'number'
        ? String(raw).trim().toLowerCase()
        : 'un';
    const map: Record<string, AllowedUnit> = {
      un: 'un',
      unidade: 'un',
      unidades: 'un',
      kg: 'kg',
      quilograma: 'kg',
      quilogramas: 'kg',
      g: 'g',
      grama: 'g',
      gramas: 'g',
      l: 'l',
      litro: 'l',
      litros: 'l',
      ml: 'ml',
      mililitro: 'ml',
      mililitros: 'ml',
      pack: 'pack',
      pacote: 'pack',
      pacotes: 'pack',
      dz: 'dz',
      duzia: 'dz',
      duzias: 'dz',
    };
    const u =
      map[s] ??
      (ALLOWED_UNITS.includes(s as AllowedUnit) ? (s as AllowedUnit) : null);
    return u ?? 'un';
  }

  private mapParsedObjectToShoppingResult(
    parsed: Record<string, unknown>,
    groupsList: string[],
  ): ShoppingListItemTextAiResult {
    const nameRaw = parsed.name;
    if (typeof nameRaw !== 'string' || !nameRaw.trim()) {
      throw new AiProviderException();
    }

    let quantity = Number(parsed.quantity);
    if (!Number.isFinite(quantity) || quantity < 0.01) {
      quantity = 1;
    }

    const unit = this.coerceUnit(parsed.unit);

    const groupObj = parsed.group as Record<string, unknown> | undefined;
    const groupName =
      typeof groupObj?.name === 'string' && groupObj.name.trim()
        ? groupObj.name.trim()
        : 'Alimentação';
    const isNew = groupObj?.isNew === true || groupsList.length === 0;

    return {
      name: nameRaw.trim(),
      quantity,
      unit,
      group: {
        name: groupName,
        isNew: Boolean(isNew),
      },
      confidence: 0.85,
      provider: this.name,
    };
  }

  async analyze(
    text: string,
    options?: TextRecognitionAnalyzeOptions,
  ): Promise<ShoppingListItemTextAiResult> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'text_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const groupsList = options?.groups?.filter(Boolean) ?? [];
        const groupsCsv =
          groupsList.length > 0
            ? groupsList.join(', ')
            : '(nenhuma categoria cadastrada ainda)';

        const allowedUnits = ALLOWED_UNITS.join(', ');

        const prompt = buildShoppingListItemPrompt(groupsCsv, allowedUnits);

        const result = await this.model.generateContent(
          `${prompt}\n\nTexto do usuário:\n${text}`,
        );

        const responseText = result.response.text();
        const cleaned = this.cleanModelJson(responseText);
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;

        return this.mapParsedObjectToShoppingResult(parsed, groupsList);
      },
    );
  }

  async analyzeBulk(
    text: string,
    options?: TextRecognitionAnalyzeOptions,
  ): Promise<ShoppingListItemTextAiResultArray> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'text_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const groupsList = options?.groups?.filter(Boolean) ?? [];
        const groupsCsv =
          groupsList.length > 0
            ? groupsList.join(', ')
            : '(nenhuma categoria cadastrada ainda)';

        const allowedUnits = ALLOWED_UNITS.join(', ');

        const prompt = buildShoppingListBulkPrompt(groupsCsv, allowedUnits);

        const result = await this.model.generateContent(
          `${prompt}\n\nTexto do usuário:\n${text}`,
        );

        const responseText = result.response.text();
        const cleaned = this.cleanModelJson(responseText);
        const root = JSON.parse(cleaned) as Record<string, unknown>;

        const rawItems = root.items;
        if (!Array.isArray(rawItems) || rawItems.length === 0) {
          throw new AiProviderException();
        }

        const items: ShoppingListItemTextAiResult[] = [];
        for (let i = 0; i < rawItems.length; i++) {
          const el = rawItems[i];
          if (!el || typeof el !== 'object' || Array.isArray(el)) {
            throw new AiProviderException();
          }
          items.push(
            this.mapParsedObjectToShoppingResult(
              el as Record<string, unknown>,
              groupsList,
            ),
          );
        }

        return { items };
      },
    );
  }

  async parseCoupon(
    text: string,
    options?: CouponParseOptions,
  ): Promise<CouponTextResult> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'text_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const rawGroups = options?.groups?.filter(Boolean) ?? [];
        const groupList =
          rawGroups.length > 0 ? rawGroups : [...DEFAULT_COUPON_GROUP_NAMES];
        const groups = groupList.join(', ');
        const payment = options?.defaultPayment || 'Cartão de crédito';

        const prompt = buildCouponTextPrompt(text, groups, payment);

        const result = await this.model.generateContent(prompt);
        const responseText = result.response.text();
        const cleaned = this.cleanModelJson(responseText);
        const parsed = JSON.parse(cleaned) as Record<string, unknown>;

        if (typeof parsed.value !== 'number') {
          throw new AiProviderException();
        }
        if (!Array.isArray(parsed.items)) {
          throw new AiProviderException();
        }

        const store = parsed.store as { name?: unknown } | undefined;
        const aiName = pickCouponStoreName(parsed.name, store?.name);
        const isNameFallback = aiName === null;
        const name =
          aiName ?? buildFallbackCouponStoreName(parsed.items, groupList);

        return {
          ...(parsed as unknown as CouponTextResult),
          name,
          store: { name },
          isNameFallback,
          provider: this.name,
          confidence: isNameFallback ? 0.7 : 0.9,
        };
      },
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.appConfig.getGoogleApiKey();
      if (!apiKey) {
        return false;
      }
      const usage = await this.apiQuotaService.getCurrentUsage(this.name);
      return usage.dailyLimit === 0 || usage.remaining > 0;
    } catch {
      return false;
    }
  }

  async getQuotaInfo(): Promise<{
    requestCount: number;
    dailyLimit: number;
    remaining: number;
  }> {
    return this.apiQuotaService.getCurrentUsage(this.name);
  }

  async analyzeHealthExamText(text: string): Promise<ExtractedExamData> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'text_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const prompt = buildHealthExamTextExtractionPrompt(text);

        if (!this.model) {
          throw new AiProviderException();
        }

        const result = await this.model.generateContent(prompt);
        const clean = this.cleanModelJson(result.response.text());
        return JSON.parse(clean) as ExtractedExamData;
      },
    );
  }

  /** @deprecated Use analyzeHealthExamText */
  async analyzeHealthLabText(text: string): Promise<ExtractedExamData> {
    return this.analyzeHealthExamText(text);
  }

  async generateHealthOverview(examsContext: string): Promise<string> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'text_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const prompt = buildHealthOverviewPrompt(examsContext);

        if (!this.model) {
          throw new AiProviderException();
        }

        const result = await this.model.generateContent(prompt);
        const text = result.response.text()?.trim();
        if (!text) {
          throw new AiProviderException();
        }
        return text;
      },
    );
  }

  async analyzePrescriptionText(
    text: string,
  ): Promise<ExtractedPrescriptionData> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'text_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const prompt = buildPrescriptionTextExtractionPrompt(text);

        if (!this.model) {
          throw new AiProviderException();
        }

        const result = await this.model.generateContent(prompt);
        const clean = this.cleanModelJson(result.response.text());
        return JSON.parse(clean) as ExtractedPrescriptionData;
      },
    );
  }
}
