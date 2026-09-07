import { Injectable, Logger } from '@nestjs/common';
import {
  GenerateContentResult,
  GoogleGenerativeAI,
} from '@google/generative-ai';
import {
  IImageRecognitionProvider,
  AnalyzeOptions,
} from '../interfaces/image-recognition-provider.interface';
import { ImageRecognitionResult } from '../../types/imageRecognitionType';
import { ImageRecognitionException } from '../../exceptions/imageRecognition.exception';
import { AiProviderException } from 'src/common/ai-provider/ai-provider.exception';
import {
  GEMINI_VISION_MODELS,
  generateWithRetryFallback,
} from 'src/common/ai-provider/gemini-retry-fallback';
import { measureThenWrapAiCall } from 'src/common/ai-provider/wrap-ai-call-error';
import { AppConfig } from 'src/common/app-config/app.config';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { AiCallTelemetryService } from 'src/common/logging/ai-call-telemetry.service';
import { logJson } from 'src/common/logging/log-event.util';
import {
  ExtractedExamData,
  ExtractedPrescriptionData,
} from 'src/text-recognition/types/textRecognitionType';
import { buildHealthExamImageExtractionPrompt } from 'src/common/prompts/health-exam-extraction.prompt';
import { buildHealthImagingImageExtractionPrompt } from 'src/common/prompts/health-imaging-image.prompt';
import { buildPrescriptionImageExtractionPrompt } from 'src/common/prompts/prescription-extraction.prompt';
import {
  buildImageExpensePrompt,
  buildImageRevenuePrompt,
} from 'src/common/prompts/image-finance.prompt';

@Injectable()
export class GeminiProvider implements IImageRecognitionProvider {
  name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly dailyLimit: number;

  constructor(
    private readonly appConfig: AppConfig,
    private readonly apiQuotaService: ApiQuotaService,
    private readonly aiCallTelemetry: AiCallTelemetryService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.appConfig.getGoogleApiKey());
    this.dailyLimit = this.appConfig.getGeminiDailyLimit();
  }

  async analyze(
    imageData: string,
    options?: AnalyzeOptions,
  ): Promise<ImageRecognitionResult> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'image_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        if (!imageData.startsWith('data:image/')) {
          throw new ImageRecognitionException('Formato de imagem inválido');
        }

        const groups =
          options?.groups?.join(', ') ||
          'Alimentação, Bebida, Limpeza, Higiene, Outros';
        const payment = options?.defaultPayment || 'Cartão de crédito';
        const context = options?.context || 'expense';

        const prompt =
          context === 'revenue'
            ? buildImageRevenuePrompt()
            : buildImageExpensePrompt(groups, payment);

        const result = await this.generateVisionContent(
          prompt,
          imageData.split(';')[0].split(':')[1],
          imageData.split(',')[1],
          'image_recognition',
        );

        const parsedResult = this.parseJsonResponse<ImageRecognitionResult>(
          result.response.text(),
        );

        return {
          ...parsedResult,
          provider: this.name,
          confidence: 0.9, // TODO: Implementar cálculo de confiança
        };
      },
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.appConfig.getGoogleApiKey();
      if (!apiKey) return false;

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
    return await this.apiQuotaService.getCurrentUsage(this.name);
  }

  async analyzeHealthExamImage(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedExamData> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'image_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const result = await this.generateVisionContent(
          buildHealthExamImageExtractionPrompt(),
          mimeType,
          base64Data,
          'health_exam',
        );

        return this.parseJsonResponse<ExtractedExamData>(
          result.response.text(),
        );
      },
    );
  }

  /** @deprecated Use analyzeHealthExamImage */
  async analyzeHealthLabImage(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedExamData> {
    return this.analyzeHealthExamImage(base64Data, mimeType);
  }

  async analyzeHealthImaging(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedExamData> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'image_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const result = await this.generateVisionContent(
          buildHealthImagingImageExtractionPrompt(),
          mimeType,
          base64Data,
          'health_imaging',
        );

        return this.parseJsonResponse<ExtractedExamData>(
          result.response.text(),
        );
      },
    );
  }

  async analyzePrescriptionImage(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedPrescriptionData> {
    return measureThenWrapAiCall(
      this.aiCallTelemetry,
      'image_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const result = await this.generateVisionContent(
          buildPrescriptionImageExtractionPrompt(),
          mimeType,
          base64Data,
          'prescription',
        );

        return this.parseJsonResponse<ExtractedPrescriptionData>(
          result.response.text(),
        );
      },
    );
  }

  private async generateVisionContent(
    prompt: string,
    mimeType: string,
    data: string,
    feature: string,
  ): Promise<GenerateContentResult> {
    if (!this.appConfig.getGoogleApiKey()) {
      throw new AiProviderException();
    }

    let attempts = 0;
    let lastModel: string | undefined;

    try {
      const {
        value,
        model,
        attempts: successAttempts,
      } = await generateWithRetryFallback(GEMINI_VISION_MODELS, (modelName) => {
        lastModel = modelName;
        attempts += 1;
        return this.genAI
          .getGenerativeModel({ model: modelName })
          .generateContent([prompt, { inlineData: { mimeType, data } }]);
      });

      this.logVisionEvent({
        ok: true,
        feature,
        model_used: model,
        attempts: successAttempts,
        fallback: model !== GEMINI_VISION_MODELS[0],
      });

      return value;
    } catch (err) {
      this.logVisionEvent(
        {
          ok: false,
          feature,
          model_used: lastModel,
          attempts,
          fallback: lastModel != null && lastModel !== GEMINI_VISION_MODELS[0],
        },
        'warn',
      );
      throw err;
    }
  }

  private logVisionEvent(
    payload: {
      ok: boolean;
      feature: string;
      model_used?: string;
      attempts: number;
      fallback: boolean;
    },
    level: 'log' | 'warn' = 'log',
  ): void {
    logJson(
      this.logger,
      {
        event: 'ai_gemini_vision',
        ...payload,
      },
      level,
    );
  }

  private parseJsonResponse<T>(raw: string): T {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(cleaned) as T;
  }
}
