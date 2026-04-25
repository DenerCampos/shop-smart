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
            prompt = `Analise esta imagem de um comprovante, recibo ou documento de receita/entrada financeira e extraia as seguintes informações em formato JSON:
        - name: descrição da receita (ex: Salário, Freelance, Venda, Comissão)
          IMPORTANTE: Converta o nome (name) para "Title Case" (apenas iniciais maiúsculas), remova abreviações excessivas e tente deduzir o nome completo e amigável da descrição.
          Ao expandir abreviações, use apenas o contexto presente no texto. Se não tiver certeza absoluta do nome completo, apenas converta para 'Title Case' e remova caracteres especiais.
        - value: valor total da receita (número)
        - date: data da receita (formato: YYYY-MM-DD), se não for possível identificar, retorne a data atual no Brasil/America do Sul
        - repeat: boolean indicando se é uma receita recorrente (ex: salário mensal = true, venda única = false)
        
        IMPORTANTE: 
        - Todas as chaves devem estar em inglês (name, value, date, repeat).
        - Se a imagem mencionar algo como "mensal", "recorrente", "fixo", defina repeat como true
        - Se não for possível identificar se é recorrente, assuma false
        - Retorne apenas o JSON, sem explicações adicionais.`;
          } else {
            prompt = `Analise esta imagem de um cupom fiscal ou nota fiscal e extraia as seguintes informações em formato JSON:
        - name: nome do estabelecimento
        - value: valor total da nota (número)
        - date: data da compra (formato: YYYY-MM-DD), se não for possível identificar, retorne a data atual no Brasil/America do Sul
        - items: array de produtos, cada item deve conter:
          * code: código do produto, se não for possível identificar, retorne '1'
          * name: nome do produto
          IMPORTANTE: Converta o nome (name) para "Title Case" (apenas iniciais maiúsculas), remova abreviações excessivas e tente deduzir o nome completo e amigável do produto (ex: de 'MAC VILM OV ESP' para 'Macarrão de Ovos Vilma Especial'). 
          Ao expandir abreviações, use apenas o contexto presente no texto. Se não tiver certeza absoluta do nome completo, apenas converta para 'Title Case' e remova caracteres especiais.
          Mantenha informações de peso/volume/unidade (ex: 500g, 1L,1U).
          * quantity: quantidade (número), se não for possível identificar, retorne 0
          * unit: unidade - use 'unidade' para UN, 'quilograma' para KG, ou 'pacote' para PT, se não for possível identificar, retorne 'unidade'
          * value: valor unitário (número), se não for possível identificar, retorne 0
          * total: valor total do item (número), se não for possível identificar, retorne 0
          * group: objeto com a propriedade 'name' contendo o nome do grupo de classificação. Os grupos possíveis são: ${groups}
        - store: objeto com a propriedade 'name' contendo o nome do estabelecimento
        - payment: objeto com a propriedade 'name' contendo o nome do método de pagamento. Se não for possível identificar, use '${payment}'
        
        IMPORTANTE: Todas as chaves devem estar em inglês (code, name, quantity, unit, value, total, group, store, payment, name).
        Retorne apenas o JSON, sem explicações adicionais.`;
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
