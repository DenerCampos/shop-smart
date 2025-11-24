import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import {
  IAudioRecognitionProvider,
  AnalyzeOptions,
} from '../interfaces/audio-recognition-provider.interface';
import { AudioRecognitionResult } from '../../types/audioRecognitionType';
import { AppConfig } from 'src/common/app-config/app.config';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { AudioRecognitionException } from '../../exceptions/audioRecognition.exception';

@Injectable()
export class GeminiAudioProvider implements IAudioRecognitionProvider {
  name = 'gemini-audio';
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel | null;
  private readonly dailyLimit: number;

  constructor(
    private readonly appConfig: AppConfig,
    private readonly apiQuotaService: ApiQuotaService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.appConfig.getGoogleApiKey());
    // Gemini 2.5 Flash suporta multimodal (texto, imagem, áudio, vídeo)
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
    });
    this.dailyLimit = this.appConfig.getGeminiAudioDailyLimit();
  }

  /**
   * Normaliza o MIME type para formato aceito pelo Gemini
   * Gemini aceita apenas audio/* para processamento de áudio
   */
  private normalizeMimeType(mimeType: string): string {
    // Remove parâmetros (ex: video/webm;codecs=opus -> video/webm)
    const cleanMimeType = mimeType.split(';')[0].trim().toLowerCase();

    // Mapeamento de MIME types de vídeo para áudio
    // Navegadores frequentemente gravam áudio como video/webm
    const mimeTypeMapping: Record<string, string> = {
      'video/webm': 'audio/webm',
      'video/ogg': 'audio/ogg',
      'video/mp4': 'audio/mp4',
    };

    return mimeTypeMapping[cleanMimeType] || cleanMimeType;
  }

  async analyze(
    audioData: string | Buffer,
    options?: AnalyzeOptions,
  ): Promise<AudioRecognitionResult> {
    try {
      await this.apiQuotaService.checkAndIncrementQuota(
        this.name,
        this.dailyLimit,
      );

      let base64Audio: string;
      let mimeType: string;

      if (Buffer.isBuffer(audioData)) {
        if (audioData.length === 0) {
          throw new Error('Buffer de áudio está vazio');
        }

        base64Audio = audioData.toString('base64');

        if (!base64Audio || base64Audio.length === 0) {
          throw new Error('Falha ao converter buffer para base64');
        }

        // Normaliza o MIME type (video/webm -> audio/webm)
        const rawMimeType = options?.mimeType || 'audio/webm';
        mimeType = this.normalizeMimeType(rawMimeType);
      } else if (
        audioData.startsWith('data:audio/') ||
        audioData.startsWith('data:video/')
      ) {
        // Suporta data URL (backward compatibility)
        const rawMimeType = audioData.split(';')[0].split(':')[1];
        mimeType = this.normalizeMimeType(rawMimeType);
        base64Audio = audioData.split(',')[1];
      } else {
        throw new Error(
          'Formato de áudio inválido. Esperado Buffer ou data URL',
        );
      }

      // Define valores padrão
      const groups =
        options?.groups?.join(', ') ||
        'Alimentação, Bebida, Limpeza, Higiene, Outros';
      const payment = options?.defaultPayment || 'Cartão de crédito';

      const prompt = `Você é um assistente que analisa áudios de despesas.
      O usuário vai descrever uma despesa verbalmente (compra em estabelecimento).

      Extraia as seguintes informações e retorne APENAS um JSON válido (sem markdown, sem explicações):
      {
        "name": "descrição da despesa/compra",
        "value": valor total numérico da compra,
        "date": "data da compra no formato YYYY-MM-DD (se não mencionada, use a data de hoje no Brasil/America do Sul)",
        "repeat": boolean indicando se é uma despesa recorrente,
        "items": [
          {
            "code": "código do produto (use '1' se não mencionado)",
            "name": "nome do produto",
            "quantity": quantidade numérica,
            "unit": "unidade (unidade, quilograma, ou pacote)",
            "value": valor unitário numérico,
            "total": valor total do item (quantity * value),
            "group": {
              "name": "categoria do produto - ESCOLHA entre: ${groups}"
            }
          }
        ],
        "store": {
          "name": "nome do estabelecimento/loja"
        },
        "payment": {
          "name": "forma de pagamento (use '${payment}' se não mencionado)"
        }
      }

      IMPORTANTE:
      - Todas as chaves devem estar em inglês
      - Se o usuário mencionar múltiplos produtos, inclua todos no array items
      - Se não mencionar quantidade, use 1
      - Se não mencionar valor unitário mas mencionar total, calcule
      - Se mencionar apenas o total geral, crie um item único com esse valor
      - Retorne APENAS o JSON, sem \`\`\`json ou qualquer marcação
      - Se não mencionar a data, use a data de hoje no Brasil/America do Sul no formato YYYY-MM-DD no campo date (ex: 2025-11-24)
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Audio,
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
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedResult = JSON.parse(cleanedText);

      return {
        ...parsedResult,
        provider: this.name,
        confidence: 0.85,
      };
    } catch (error) {
      throw new AudioRecognitionException(
        `Erro ao analisar áudio: ${error.message}`,
      );
    }
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

  /**
   * Retorna informações sobre o uso da quota
   */
  async getQuotaInfo(): Promise<{
    requestCount: number;
    dailyLimit: number;
    remaining: number;
  }> {
    return await this.apiQuotaService.getCurrentUsage(this.name);
  }
}
