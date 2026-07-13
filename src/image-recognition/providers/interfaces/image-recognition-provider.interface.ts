import { ImageRecognitionResult } from '../../types/imageRecognitionType';
import { ExtractedExamData, ExtractedPrescriptionData } from 'src/text-recognition/types/textRecognitionType';

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
  /** Analisa imagem/PDF de laudo ou resultado de exame (lab ou imagem). */
  analyzeHealthExamImage?(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedExamData>;
  /** @deprecated Use analyzeHealthExamImage */
  analyzeHealthLabImage?(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedExamData>;
  /** Analisa imagem/PDF de laudo médico e retorna dados estruturados de exame. */
  analyzeHealthImaging?(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedExamData>;
  analyzePrescriptionImage?(
    base64Data: string,
    mimeType: string,
  ): Promise<ExtractedPrescriptionData>;
}
