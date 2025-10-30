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
      useFactory: (appConfig: AppConfig) => [new GeminiProvider(appConfig)],
      inject: [AppConfig],
    },
  ],
  exports: [ImageRecognitionService, 'IImageRecognitionRepository'],
})
export class ImageRecognitionModule {}
