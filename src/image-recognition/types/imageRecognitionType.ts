export interface ImageRecognitionResult {
  name: string;
  value: number;
  repeat: boolean;
  items: {
    code: string;
    name: string;
    quantity: number;
    unit: string;
    value: number;
    total: number;
    group: {
      name: string;
    };
  }[];
  store: {
    name: string;
  };
  payment: {
    method: string;
  };
  date: Date;
  confidence: number;
  provider: string;
}

export enum RecognitionStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}
