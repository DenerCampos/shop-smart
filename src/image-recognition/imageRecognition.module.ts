import { Module } from '@nestjs/common';
import { ImageRecognitionController } from './imageRecognition.controller';
import { ImageRecognitionService } from './imageRecognition.service';
import { ImageRecognitionRepository } from './repositories/imageRecognition.repository';
import { ImageRecognition } from './entities/imageRecognition.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { GeminiProvider } from './providers/gemini/gemini.provider';
import { ImageRecognitionProviderFactory } from './providers/factory/image-recognition-provider.factory';
import { AppConfig } from 'src/common/app-config/app.config';
import { UserModule } from 'src/user/user.module';
import { GroupModule } from 'src/group/group.module';
import { PaymentModule } from 'src/payment/payment.module';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { AiCallTelemetryService } from 'src/common/logging/ai-call-telemetry.service';

@Module({
  imports: [
    CommonModule,
    UserModule,
    GroupModule,
    PaymentModule,
    TypeOrmModule.forFeature([ImageRecognition]),
  ],
  controllers: [ImageRecognitionController],
  providers: [
    ImageRecognitionService,
    ImageRecognitionProviderFactory,
    {
      provide: 'IImageRecognitionRepository',
      useClass: ImageRecognitionRepository,
    },
    {
      provide: 'RECOGNITION_PROVIDERS',
      useFactory: (
        appConfig: AppConfig,
        apiQuotaService: ApiQuotaService,
        aiCallTelemetry: AiCallTelemetryService,
      ) => [new GeminiProvider(appConfig, apiQuotaService, aiCallTelemetry)],
      inject: [AppConfig, ApiQuotaService, AiCallTelemetryService],
    },
  ],
  exports: [ImageRecognitionService, 'IImageRecognitionRepository'],
})
export class ImageRecognitionModule {}
