import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import {
  IImageRecognitionProvider,
  AnalyzeOptions,
} from '../interfaces/image-recognition-provider.interface';
import { ImageRecognitionResult } from '../../types/imageRecognitionType';
import { ImageRecognitionException } from '../../exceptions/imageRecognition.exception';
import { AiProviderException } from 'src/common/ai-provider/ai-provider.exception';
import { measureThenWrapAiCall } from 'src/common/ai-provider/wrap-ai-call-error';
import { AppConfig } from 'src/common/app-config/app.config';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { AiCallTelemetryService } from 'src/common/logging/ai-call-telemetry.service';
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

        let prompt: string;

        if (context === 'revenue') {
          prompt = buildImageRevenuePrompt();
        } else {
          prompt = buildImageExpensePrompt(groups, payment);
        }

        const result = await this.model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: imageData.split(';')[0].split(':')[1],
              data: imageData.split(',')[1],
            },
          },
        ]);
        const response = result.response;
        const responseText = response.text();

        let cleanedText = responseText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '');
        }

        const parsedResult = JSON.parse(cleanedText);

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

      // Verifica se ainda há quota disponível
      const usage = await this.apiQuotaService.getCurrentUsage(this.name);

      // Se não há registro ainda (dailyLimit é 0), considera disponível
      // Caso contrário, verifica se há quota restante
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

        const prompt = buildHealthExamImageExtractionPrompt();

        if (!this.model) {
          throw new AiProviderException();
        }

        const result = await this.model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ]);

        let clean = result.response.text().trim();
        if (clean.startsWith('```json')) {
          clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (clean.startsWith('```')) {
          clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        return JSON.parse(clean) as ExtractedExamData;
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

        const prompt = buildHealthImagingImageExtractionPrompt();

        if (!this.model) {
          throw new AiProviderException();
        }

        const result = await this.model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ]);

        let clean = result.response.text().trim();
        if (clean.startsWith('```json')) {
          clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (clean.startsWith('```')) {
          clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        return JSON.parse(clean) as ExtractedExamData;
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

        const prompt = buildPrescriptionImageExtractionPrompt();

        if (!this.model) {
          throw new AiProviderException();
        }

        const result = await this.model.generateContent([
          prompt,
          { inlineData: { mimeType, data: base64Data } },
        ]);

        let clean = result.response.text().trim();
        if (clean.startsWith('```json')) {
          clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (clean.startsWith('```')) {
          clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }

        return JSON.parse(clean) as ExtractedPrescriptionData;
      },
    );
  }
}
