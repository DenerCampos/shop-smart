import { AudioRecognitionResult } from '../../types/audioRecognitionType';

export interface AnalyzeOptions {
  groups?: string[];
  defaultPayment?: string;
  mimeType?: string; // MIME type do arquivo de áudio
  context?: 'expense' | 'revenue'; // Contexto da análise: despesa ou receita
}

export interface QuotaInfo {
  requestCount: number;
  dailyLimit: number;
  remaining: number;
}

export interface IAudioRecognitionProvider {
  name: string;
  analyze(
    audioData: Buffer | string,
    options?: AnalyzeOptions,
  ): Promise<AudioRecognitionResult>;
  isAvailable(): Promise<boolean>;
  getQuotaInfo(): Promise<QuotaInfo>;
}
