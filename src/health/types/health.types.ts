// Re-export dos tipos compartilhados definidos em text-recognition
export type {
  ExtractedExamData,
  ExtractedExamItem,
  ExtractedPrescriptionData,
  ExtractedPrescriptionItem,
  HealthExamType,
} from 'src/text-recognition/types/textRecognitionType';

export type HealthSourceType = 'MANUAL' | 'PDF' | 'IMAGE_FILE';

export type HealthExamStatus = 'PENDING_REVIEW' | 'APPROVED';

export type HealthFileType = 'PDF' | 'IMAGE';

export type HealthProcessingStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';
