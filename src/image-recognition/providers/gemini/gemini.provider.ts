import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  IImageRecognitionProvider,
  AnalyzeOptions,
} from '../interfaces/image-recognition-provider.interface';
import { ImageRecognitionResult } from '../../types/imageRecognitionType';
import { ImageRecognitionException } from '../../exceptions/imageRecognition.exception';
import { AppConfig } from 'src/common/app-config/app.config';

@Injectable()
export class GeminiProvider implements IImageRecognitionProvider {
  name = 'gemini';
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(private readonly appConfig: AppConfig) {
    this.genAI = new GoogleGenerativeAI(this.appConfig.getGoogleApiKey());
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async analyze(
    imageData: string,
    options?: AnalyzeOptions,
  ): Promise<ImageRecognitionResult> {
    try {
      // Verifica se a imagem está em formato base64 data URL
      if (!imageData.startsWith('data:image/')) {
        throw new Error('Formato de imagem inválido');
      }

      // Define valores padrão
      const groups =
        options?.groups?.join(', ') ||
        'Alimentação, Bebida, Limpeza, Higiene, Outros';
      const payment = options?.defaultPayment || 'Cartão de crédito';

      const prompt = `Analise esta imagem de um cupom fiscal ou nota fiscal e extraia as seguintes informações em formato JSON:
      - name: nome do estabelecimento
      - value: valor total da nota (número)
      - date: data da compra (formato: YYYY-MM-DD)
      - items: array de produtos, cada item deve conter:
        * code: código do produto, se não for possível identificar, retorne '1'
        * name: nome do produto
        * quantity: quantidade (número), se não for possível identificar, retorne 0
        * unit: unidade - use 'unidade' para UN, 'quilograma' para KG, ou 'pacote' para PT, se não for possível identificar, retorne 'unidade'
        * value: valor unitário (número), se não for possível identificar, retorne 0
        * total: valor total do item (número), se não for possível identificar, retorne 0
        * group: objeto com a propriedade 'name' contendo o nome do grupo de classificação. Os grupos possíveis são: ${groups}
      - store: objeto com a propriedade 'name' contendo o nome do estabelecimento
      - payment: objeto com a propriedade 'name' contendo o nome do método de pagamento. Se não for possível identificar, use '${payment}'
      
      IMPORTANTE: Todas as chaves devem estar em inglês (code, name, quantity, unit, value, total, group, store, payment, name).
      Retorne apenas o JSON, sem explicações adicionais.`;

      // Prepara a imagem para o Gemini
      const parts = [
        {
          text: prompt,
        },
        {
          inlineData: {
            mimeType: imageData.split(';')[0].split(':')[1],
            data: imageData.split(',')[1],
          },
        },
      ];

      const result = await this.model.generateContent(parts);
      const response = await result.response;
      const responseText = response.text();

      console.log('response', responseText);

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
        confidence: 0.9, // TODO: Implementar cálculo de confiança
      };
    } catch (error) {
      throw new ImageRecognitionException(
        `Erro ao analisar imagem: ${error.message}`,
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.appConfig.getGoogleApiKey();
      return !!apiKey;
    } catch {
      return false;
    }
  }
}
