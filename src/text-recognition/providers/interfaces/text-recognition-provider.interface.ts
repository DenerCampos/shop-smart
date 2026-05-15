import {
  CouponTextResult,
  ShoppingListItemTextAiResult,
  ShoppingListItemTextAiResultArray,
} from '../../types/textRecognitionType';

export interface TextRecognitionAnalyzeOptions {
  groups?: string[];
}

export interface CouponParseOptions {
  groups?: string[];
  defaultPayment?: string;
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
  /** Interpreta vários produtos em um texto (ex.: separados por vírgula). */
  analyzeBulk?(
    text: string,
    options?: TextRecognitionAnalyzeOptions,
  ): Promise<ShoppingListItemTextAiResultArray>;
  parseCoupon(
    text: string,
    options?: CouponParseOptions,
  ): Promise<CouponTextResult>;
  isAvailable(): Promise<boolean>;
  getQuotaInfo(): Promise<QuotaInfo>;
}
