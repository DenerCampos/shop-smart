import { Inject, Injectable } from '@nestjs/common';
import { IImageRecognitionRepository } from './interfaces/imageRecognition.repository.interface';
import { AppConfig } from 'src/common/app-config/app.config';
import { ImageRecognitionProviderFactory } from './providers/factory/image-recognition-provider.factory';
import {
  ImageRecognitionResult,
  RecognitionStatus,
} from './types/imageRecognitionType';
import { User } from 'src/user/entities/user.entity';
import { GroupService } from 'src/group/group.service';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class ImageRecognitionService {
  private readonly url = `${this.appConfig.getBaseUrl()}/image-recognition`;

  constructor(
    @Inject('IImageRecognitionRepository')
    private readonly imageRecognitionRepository: IImageRecognitionRepository,
    private readonly groupService: GroupService,
    private readonly paymentService: PaymentService,
    private readonly appConfig: AppConfig,
    private readonly providerFactory: ImageRecognitionProviderFactory,
  ) {}

  async analyzeImage(
    imageBuffer: Buffer,
    user: User,
  ): Promise<ImageRecognitionResult> {
    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider(),
    );

    // Converte o buffer da imagem para base64
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg'; // Você pode ajustar isso baseado no tipo real da imagem
    const imageData = `data:${mimeType};base64,${base64Image}`;

    const groups = await this.groupService.findAllNames();
    const defaultPayment = await this.paymentService.getDefaultPayment();

    const options = {
      groups: groups,
      defaultPayment: defaultPayment,
    };

    try {
      // Análise da imagem
      const result = await provider.analyze(imageData, options);

      // Salva o resultado no banco
      await this.imageRecognitionRepository.create(
        {
          imageUrl: 'memory', // Indicando que a imagem veio da memória
          provider: provider.name,
          confidence: result.confidence,
          result: result,
          status: RecognitionStatus.COMPLETED, // Já está completo neste ponto
        },
        user,
      );

      return result;
    } catch (error) {
      await this.imageRecognitionRepository.create(
        {
          imageUrl: 'memory',
          provider: provider.name,
          confidence: 0,
          result: null,
          status: RecognitionStatus.FAILED,
          error: error.message,
        },
        user,
      );

      throw error;
    }
  }

  async getProviderQuota(): Promise<{
    provider: string;
    requestCount: number;
    dailyLimit: number;
    remaining: number;
  }> {
    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider(),
    );

    const quotaInfo = await provider.getQuotaInfo();
    return {
      provider: provider.name,
      ...quotaInfo,
    };
  }
}
