import { ImageRecognitionResult } from '../../types/imageRecognitionType';

export interface AnalyzeOptions {
  groups?: string[];
  defaultPayment?: string;
  context?: 'expense' | 'revenue'; // Contexto da análise: despesa ou receita
}

export interface QuotaInfo {
  requestCount: number;
  dailyLimit: number;
  remaining: number;
}

export interface IImageRecognitionProvider {
  name: string;
  analyze(
    imageData: Buffer | string,
    options?: AnalyzeOptions,
  ): Promise<ImageRecognitionResult>;
  isAvailable(): Promise<boolean>;
  getQuotaInfo(): Promise<QuotaInfo>;
}
