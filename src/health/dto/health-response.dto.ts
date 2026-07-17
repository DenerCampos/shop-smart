import { Exclude, Expose, Type } from 'class-transformer';

export class HealthUserResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class HealthExamItemEvolutionPointResponseDto {
  @Expose()
  examId: string;

  @Expose()
  itemName: string;

  @Expose()
  examDate: string | null;

  @Expose()
  resultValue: string | null;

  @Expose()
  resultUnit: string | null;

  @Expose()
  referenceRange: string | null;

  @Expose()
  isAbnormal: boolean;
}

export class HealthExamItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  itemName: string;

  @Expose()
  material: string | null;

  @Expose()
  method: string | null;

  @Expose()
  resultValue: string | null;

  @Expose()
  resultUnit: string | null;

  @Expose()
  referenceRange: string | null;

  @Expose()
  isAbnormal: boolean;

  @Expose()
  itemNotes: string | null;

  @Expose()
  findings: string | null;

  @Expose()
  conclusion: string | null;

  @Expose()
  createdAt: Date;
}

export class HealthExamFileResponseDto {
  @Expose()
  id: string;

  @Expose()
  fileUrl: string;

  @Expose()
  fileType: string;

  @Expose()
  originalFilename: string | null;

  @Expose()
  pageCount: number | null;

  @Expose()
  createdAt: Date;
}

export class HealthExamResponseDto {
  @Expose()
  id: string;

  @Expose()
  labName: string | null;

  @Expose()
  doctorName: string | null;

  @Expose()
  examDate: string | null;

  @Expose()
  examType: string;

  @Expose()
  sourceType: string;

  @Expose()
  status: string;

  @Expose()
  notes: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @Expose()
  @Type(() => HealthExamItemResponseDto)
  items: HealthExamItemResponseDto[];

  @Expose()
  @Type(() => HealthExamFileResponseDto)
  files: HealthExamFileResponseDto[];

  @Expose()
  @Type(() => HealthUserResponseDto)
  user: HealthUserResponseDto;
}

export class HealthPrescriptionItemResponseDto {
  @Expose()
  id: string;

  @Expose()
  medicationName: string;

  @Expose()
  dosage: string | null;

  @Expose()
  scheduleTimes: string[] | null;

  @Expose()
  daysOfWeek: string[] | null;

  @Expose()
  startDate: string | null;

  @Expose()
  endDate: string | null;

  @Expose()
  notes: string | null;

  @Expose()
  createdAt: Date;
}

export class HealthPrescriptionResponseDto {
  @Expose()
  id: string;

  @Expose()
  doctorName: string;

  @Expose()
  prescriptionDate: string;

  @Expose()
  notes: string | null;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Exclude()
  deletedAt: Date;

  @Expose()
  @Type(() => HealthPrescriptionItemResponseDto)
  items: HealthPrescriptionItemResponseDto[];

  @Expose()
  @Type(() => HealthUserResponseDto)
  user: HealthUserResponseDto;
}

export class HealthAiOverviewResponseDto {
  @Expose()
  id: string;

  @Expose()
  reportContent: string;

  @Expose()
  generatedAt: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => HealthUserResponseDto)
  user: HealthUserResponseDto;
}

export class HealthPatientContextResponseDto {
  @Expose()
  id: string;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => HealthUserResponseDto)
  createdBy: HealthUserResponseDto;
}

export class HealthProcessingResponseDto {
  @Expose()
  id: string;

  @Expose()
  fileUrl: string;

  @Expose()
  fileType: string;

  @Expose()
  originalFilename: string | null;

  @Expose()
  status: string;

  @Expose()
  extractedData: unknown;

  @Expose()
  errorMessage: string | null;

  @Expose()
  failedAt: Date | null;

  @Expose()
  retryCount: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => HealthUserResponseDto)
  targetUser: HealthUserResponseDto;
}

export class AnalyzePrescriptionItemResponseDto {
  @Expose()
  medicationName: string;

  @Expose()
  dosage?: string;

  @Expose()
  scheduleTimes?: string[];

  @Expose()
  daysOfWeek?: string[] | null;

  @Expose()
  startDate?: string;

  @Expose()
  endDate?: string | null;

  @Expose()
  notes?: string;
}

export class AnalyzePrescriptionResponseDto {
  @Expose()
  doctorName?: string;

  @Expose()
  prescriptionDate?: string;

  @Expose()
  notes?: string;

  @Expose()
  @Type(() => AnalyzePrescriptionItemResponseDto)
  items: AnalyzePrescriptionItemResponseDto[];
}
