import { Module } from '@nestjs/common';
import { ImageRecognitionController } from './imageRecognition.controller';
import { ImageRecognitionService } from './imageRecognition.service';
import { ImageRecognitionRepository } from './repositories/imageRecognition.repository';
import { ImageRecognition } from './entities/imageRecognition.entity';
import { ApiUsage } from './entities/apiUsage.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { GeminiProvider } from './providers/gemini/gemini.provider';
import { ImageRecognitionProviderFactory } from './providers/factory/image-recognition-provider.factory';
import { AppConfig } from 'src/common/app-config/app.config';
import { UserModule } from 'src/user/user.module';
import { GroupModule } from 'src/group/group.module';
import { PaymentModule } from 'src/payment/payment.module';
import { ApiUsageRepository } from './repositories/apiUsage.repository';
import { ApiQuotaService } from './services/apiQuota.service';

@Module({
  imports: [
    CommonModule,
    UserModule,
    GroupModule,
    PaymentModule,
    TypeOrmModule.forFeature([ImageRecognition, ApiUsage]),
  ],
  controllers: [ImageRecognitionController],
  providers: [
    ImageRecognitionService,
    ImageRecognitionProviderFactory,
    ApiQuotaService,
    {
      provide: 'IImageRecognitionRepository',
      useClass: ImageRecognitionRepository,
    },
    {
      provide: 'IApiUsageRepository',
      useClass: ApiUsageRepository,
    },
    {
      provide: 'RECOGNITION_PROVIDERS',
      useFactory: (appConfig: AppConfig, apiQuotaService: ApiQuotaService) => [
        new GeminiProvider(appConfig, apiQuotaService),
      ],
      inject: [AppConfig, ApiQuotaService],
    },
  ],
  exports: [ImageRecognitionService, 'IImageRecognitionRepository'],
})
export class ImageRecognitionModule {}
