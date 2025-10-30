import { ImageRecognitionResult } from '../../types/imageRecognitionType';

export interface AnalyzeOptions {
  groups?: string[];
  defaultPayment?: string;
}

export interface IImageRecognitionProvider {
  name: string;
  analyze(
    imageData: Buffer | string,
    options?: AnalyzeOptions,
  ): Promise<ImageRecognitionResult>;
  isAvailable(): Promise<boolean>;
}
