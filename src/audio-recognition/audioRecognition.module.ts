import { Module } from '@nestjs/common';
import { AudioRecognitionController } from './audioRecognition.controller';
import { AudioRecognitionService } from './audioRecognition.service';
import { AudioRecognitionRepository } from './repositories/audioRecognition.repository';
import { AudioRecognition } from './entities/audioRecognition.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { GeminiAudioProvider } from './providers/gemini/gemini-audio.provider';
import { AudioRecognitionProviderFactory } from './providers/factory/audio-recognition-provider.factory';
import { AppConfig } from 'src/common/app-config/app.config';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { AiCallTelemetryService } from 'src/common/logging/ai-call-telemetry.service';
import { GroupModule } from 'src/group/group.module';
import { PaymentModule } from 'src/payment/payment.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    CommonModule,
    UserModule,
    GroupModule,
    PaymentModule,
    TypeOrmModule.forFeature([AudioRecognition]),
  ],
  controllers: [AudioRecognitionController],
  providers: [
    AudioRecognitionService,
    AudioRecognitionProviderFactory,
    {
      provide: 'IAudioRecognitionRepository',
      useClass: AudioRecognitionRepository,
    },
    {
      provide: 'AUDIO_RECOGNITION_PROVIDERS',
      useFactory: (
        appConfig: AppConfig,
        apiQuotaService: ApiQuotaService,
        aiCallTelemetry: AiCallTelemetryService,
      ) => [new GeminiAudioProvider(appConfig, apiQuotaService, aiCallTelemetry)],
      inject: [AppConfig, ApiQuotaService, AiCallTelemetryService],
    },
  ],
  exports: [AudioRecognitionService, 'IAudioRecognitionRepository'],
})
export class AudioRecognitionModule {}
