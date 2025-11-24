import { AudioRecognitionResult } from '../../types/audioRecognitionType';

export interface AnalyzeOptions {
  groups?: string[];
  defaultPayment?: string;
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
