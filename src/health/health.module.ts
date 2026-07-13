import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user/user.module';
import { FileStorageModule } from 'src/file-storage/file-storage.module';
import { TextRecognitionModule } from 'src/text-recognition/textRecognition.module';
import { ImageRecognitionModule } from 'src/image-recognition/imageRecognition.module';
import { FamilyGroupMember } from 'src/family-group/entities/family-group-member.entity';
import { HealthExam } from './entities/health-exam.entity';
import { HealthExamItem } from './entities/health-exam-item.entity';
import { HealthExamFile } from './entities/health-exam-file.entity';
import { HealthExamProcessing } from './entities/health-exam-processing.entity';
import { HealthPrescription } from './entities/health-prescription.entity';
import { HealthPrescriptionItem } from './entities/health-prescription-item.entity';
import { HealthAiOverview } from './entities/health-ai-overview.entity';
import { HealthPatientContext } from './entities/health-patient-context.entity';
import { HealthExamRepository } from './repositories/health-exam.repository';
import { HealthProcessingRepository } from './repositories/health-processing.repository';
import { HealthPrescriptionRepository } from './repositories/health-prescription.repository';
import { HealthOverviewRepository } from './repositories/health-overview.repository';
import { HealthMemberRepository } from './repositories/health-member.repository';
import { HealthPatientContextRepository } from './repositories/health-patient-context.repository';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthProcessingScheduler } from './health-processing.scheduler';

@Module({
  imports: [
    CommonModule,
    UserModule,
    FileStorageModule,
    TextRecognitionModule,
    ImageRecognitionModule,
    TypeOrmModule.forFeature([
      HealthExam,
      HealthExamItem,
      HealthExamFile,
      HealthExamProcessing,
      HealthPrescription,
      HealthPrescriptionItem,
      HealthAiOverview,
      HealthPatientContext,
      FamilyGroupMember,
    ]),
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    HealthProcessingScheduler,
    { provide: 'IHealthExamRepository', useClass: HealthExamRepository },
    {
      provide: 'IHealthProcessingRepository',
      useClass: HealthProcessingRepository,
    },
    {
      provide: 'IHealthPrescriptionRepository',
      useClass: HealthPrescriptionRepository,
    },
    {
      provide: 'IHealthOverviewRepository',
      useClass: HealthOverviewRepository,
    },
    { provide: 'IHealthMemberRepository', useClass: HealthMemberRepository },
    {
      provide: 'IHealthPatientContextRepository',
      useClass: HealthPatientContextRepository,
    },
  ],
  exports: [HealthService],
})
export class HealthModule {}
