import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { GroupModule } from 'src/group/group.module';
import { UserModule } from 'src/user/user.module';
import { AppConfig } from 'src/common/app-config/app.config';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { AiCallTelemetryService } from 'src/common/logging/ai-call-telemetry.service';
import { TextRecognition } from './entities/textRecognition.entity';
import { TextRecognitionRepository } from './repositories/textRecognition.repository';
import { TextRecognitionService } from './textRecognition.service';
import { TextRecognitionController } from './textRecognition.controller';
import { TextRecognitionProviderFactory } from './providers/factory/text-recognition-provider.factory';
import { GeminiTextProvider } from './providers/gemini/gemini-text.provider';

@Module({
  imports: [
    CommonModule,
    GroupModule,
    UserModule,
    TypeOrmModule.forFeature([TextRecognition]),
  ],
  controllers: [TextRecognitionController],
  providers: [
    TextRecognitionService,
    TextRecognitionProviderFactory,
    {
      provide: 'ITextRecognitionRepository',
      useClass: TextRecognitionRepository,
    },
    {
      provide: 'TEXT_RECOGNITION_PROVIDERS',
      useFactory: (
        appConfig: AppConfig,
        apiQuotaService: ApiQuotaService,
        aiCallTelemetry: AiCallTelemetryService,
      ) => [new GeminiTextProvider(appConfig, apiQuotaService, aiCallTelemetry)],
      inject: [AppConfig, ApiQuotaService, AiCallTelemetryService],
    },
  ],
  exports: [TextRecognitionService],
})
export class TextRecognitionModule {}
