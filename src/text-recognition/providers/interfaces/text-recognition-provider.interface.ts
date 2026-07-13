import {
  CouponTextResult,
  ExtractedExamData,
  ExtractedPrescriptionData,
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
  /** Extrai dados estruturados de texto de exame laboratorial. */
  /** Analisa texto de laudo/resultado de exame (laboratorial ou imagem). */
  analyzeHealthExamText?(text: string): Promise<ExtractedExamData>;
  /** @deprecated Use analyzeHealthExamText */
  analyzeHealthLabText?(text: string): Promise<ExtractedExamData>;
  /** Gera relatório geral de saúde com base em contexto de exames. */
  generateHealthOverview?(examsContext: string): Promise<string>;
  /** Extrai dados estruturados de receituário médico a partir de texto. */
  analyzePrescriptionText?(text: string): Promise<ExtractedPrescriptionData>;
}
