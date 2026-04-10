import { ShoppingListItemTextAiResult } from '../../types/textRecognitionType';

export interface TextRecognitionAnalyzeOptions {
  groups?: string[];
}

export interface QuotaInfo {
  requestCount: number;
  dailyLimit: number;
  remaining: number;
}

export interface ITextRecognitionProvider {
  name: string;
  analyze(
    text: string,
    options?: TextRecognitionAnalyzeOptions,
  ): Promise<ShoppingListItemTextAiResult>;
  isAvailable(): Promise<boolean>;
  getQuotaInfo(): Promise<QuotaInfo>;
}
