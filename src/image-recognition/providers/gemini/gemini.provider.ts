import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import {
  IImageRecognitionProvider,
  AnalyzeOptions,
} from '../interfaces/image-recognition-provider.interface';
import { ImageRecognitionResult } from '../../types/imageRecognitionType';
import { ImageRecognitionException } from '../../exceptions/imageRecognition.exception';
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
    return this.aiCallTelemetry.measure(
      'image_recognition',
      this.name,
      async () => {
        try {
          // Verifica a quota antes de fazer a requisição
          await this.apiQuotaService.checkAndIncrementQuota(
            this.name,
            this.dailyLimit,
          );

          // Verifica se a imagem está em formato base64 data URL
          if (!imageData.startsWith('data:image/')) {
            throw new Error('Formato de imagem inválido');
          }

          // Define valores padrão
          const groups =
            options?.groups?.join(', ') ||
            'Alimentação, Bebida, Limpeza, Higiene, Outros';
          const payment = options?.defaultPayment || 'Cartão de crédito';
          const context = options?.context || 'expense';

          // Monta o prompt de acordo com o contexto (despesa ou receita)
          let prompt: string;

          if (context === 'revenue') {
            prompt = buildImageRevenuePrompt();
          } else {
            prompt = buildImageExpensePrompt(groups, payment);
          }

          // Prepara a imagem para o Gemini
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

          // Remove marcadores de código markdown se existirem
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
        } catch (error) {
          throw new ImageRecognitionException(
            `Erro ao analisar imagem: ${error.message}`,
          );
        }
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
    return this.aiCallTelemetry.measure(
      'image_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const prompt = buildHealthExamImageExtractionPrompt();

        if (!this.model) {
          throw new ImageRecognitionException('Modelo de IA não disponível.');
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

        try {
          return JSON.parse(clean) as ExtractedExamData;
        } catch {
          throw new ImageRecognitionException(
            'Resposta da IA para exame médico (imagem) não é um JSON válido',
          );
        }
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
    return this.aiCallTelemetry.measure(
      'image_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const prompt = buildHealthImagingImageExtractionPrompt();

        if (!this.model) {
          throw new ImageRecognitionException('Modelo de IA não disponível.');
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

        try {
          return JSON.parse(clean) as ExtractedExamData;
        } catch {
          throw new ImageRecognitionException(
            'Resposta da IA para laudo de imagem não é um JSON válido',
          );
        }
      },
    );
  }

  async analyzePrescriptionImage(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedPrescriptionData> {
    return this.aiCallTelemetry.measure(
      'image_recognition',
      this.name,
      async () => {
        await this.apiQuotaService.checkAndIncrementQuota(
          this.name,
          this.dailyLimit,
        );

        const prompt = buildPrescriptionImageExtractionPrompt();

        if (!this.model) {
          throw new ImageRecognitionException('Modelo de IA não disponível.');
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

        try {
          return JSON.parse(clean) as ExtractedPrescriptionData;
        } catch {
          throw new ImageRecognitionException(
            'Resposta da IA para receituário não é um JSON válido',
          );
        }
      },
    );
  }
}
