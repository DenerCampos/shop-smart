import { Inject, Injectable } from '@nestjs/common';
import { IImageRecognitionRepository } from './interfaces/imageRecognition.repository.interface';
import { AppConfig } from 'src/common/app-config/app.config';
import { ImageRecognitionProviderFactory } from './providers/factory/image-recognition-provider.factory';
import {
  ImageRecognitionResult,
  RecognitionStatus,
} from './types/imageRecognitionType';
import { ExtractedExamData, ExtractedPrescriptionData } from 'src/text-recognition/types/textRecognitionType';
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
    context: 'expense' | 'revenue' = 'expense',
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
      context: context, // Passa o contexto para o provider
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

  /**
   * Analisa imagem/PDF de laudo ou resultado de exame (lab ou imagem).
   * Persiste tentativa em `image_recognition`.
   */
  async analyzeHealthExamImage(
    base64Data: string,
    mimeType: string,
    user: User,
  ): Promise<ExtractedExamData> {
    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider(),
    );

    const analyze =
      provider.analyzeHealthExamImage ?? provider.analyzeHealthLabImage;

    if (typeof analyze !== 'function') {
      throw new Error('Provedor não suporta análise de exames médicos por imagem.');
    }

    try {
      const result = await analyze.call(provider, base64Data, mimeType);

      await this.imageRecognitionRepository.create(
        {
          imageUrl: 'memory',
          provider: provider.name,
          confidence: 1,
          result: result as object,
          status: RecognitionStatus.COMPLETED,
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
          error: error instanceof Error ? error.message : String(error),
        },
        user,
      );

      throw error;
    }
  }

  /** @deprecated Use analyzeHealthExamImage */
  async analyzeHealthLabImage(
    base64Data: string,
    mimeType: string,
    user: User,
  ): Promise<ExtractedExamData> {
    return this.analyzeHealthExamImage(base64Data, mimeType, user);
  }

  /**
   * Analisa imagem ou PDF de laudo médico e retorna dados estruturados de exame.
   * Persiste tentativa em `image_recognition`.
   */
  async analyzeHealthImaging(
    base64Data: string,
    mimeType: string,
    user: User,
  ): Promise<ExtractedExamData> {
    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider(),
    );

    if (typeof provider.analyzeHealthImaging !== 'function') {
      throw new Error('Provedor não suporta análise de laudos de imagem.');
    }

    try {
      const result = await provider.analyzeHealthImaging(base64Data, mimeType);

      await this.imageRecognitionRepository.create(
        {
          imageUrl: 'memory',
          provider: provider.name,
          confidence: 1,
          result: result as object,
          status: RecognitionStatus.COMPLETED,
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
          error: error instanceof Error ? error.message : String(error),
        },
        user,
      );

      throw error;
    }
  }

  async analyzePrescriptionImage(
    base64Data: string,
    mimeType: string,
    user: User,
  ): Promise<ExtractedPrescriptionData> {
    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider(),
    );

    if (typeof provider.analyzePrescriptionImage !== 'function') {
      throw new Error('Provedor não suporta análise de receituários por imagem.');
    }

    try {
      const result = await provider.analyzePrescriptionImage(base64Data, mimeType);

      await this.imageRecognitionRepository.create(
        {
          imageUrl: 'memory',
          provider: provider.name,
          confidence: 1,
          result: result as object,
          status: RecognitionStatus.COMPLETED,
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
          error: error instanceof Error ? error.message : String(error),
        },
        user,
      );

      throw error;
    }
  }
}
