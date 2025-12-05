import { Inject, Injectable } from '@nestjs/common';
import { IAudioRecognitionRepository } from './interfaces/audioRecognition.repository.interface';
import { AppConfig } from 'src/common/app-config/app.config';
import { AudioRecognitionProviderFactory } from './providers/factory/audio-recognition-provider.factory';
import {
  AudioRecognitionResult,
  RecognitionStatus,
} from './types/audioRecognitionType';
import { User } from 'src/user/entities/user.entity';
import { GroupService } from 'src/group/group.service';
import { PaymentService } from 'src/payment/payment.service';

@Injectable()
export class AudioRecognitionService {
  private readonly url = `${this.appConfig.getBaseUrl()}/audio-recognition`;

  constructor(
    @Inject('IAudioRecognitionRepository')
    private readonly audioRecognitionRepository: IAudioRecognitionRepository,
    private readonly groupService: GroupService,
    private readonly paymentService: PaymentService,
    private readonly appConfig: AppConfig,
    private readonly providerFactory: AudioRecognitionProviderFactory,
  ) {}

  async analyzeAudio(
    audioBuffer: Buffer,
    mimeType: string,
    user: User,
    context: 'expense' | 'revenue' = 'expense',
  ): Promise<AudioRecognitionResult> {
    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider() + '-audio',
    );

    if (!Buffer.isBuffer(audioBuffer) || audioBuffer.length === 0) {
      throw new Error('Buffer de áudio inválido ou vazio');
    }

    const groups = await this.groupService.findAllNames();
    const defaultPayment = await this.paymentService.getDefaultPayment();

    const options = {
      groups: groups,
      defaultPayment: defaultPayment,
      mimeType: mimeType,
      context: context, // Passa o contexto para o provider
    };

    try {
      const result = await provider.analyze(audioBuffer, options);

      // Salva o resultado no banco
      await this.audioRecognitionRepository.create(
        {
          audioUrl: 'memory', // Indicando que o áudio veio da memória
          provider: provider.name,
          confidence: result.confidence,
          result: result,
          status: RecognitionStatus.COMPLETED,
        },
        user,
      );

      return result;
    } catch (error) {
      await this.audioRecognitionRepository.create(
        {
          audioUrl: 'memory',
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
      this.appConfig.getDefaultRecognitionProvider() + '-audio',
    );

    const quotaInfo = await provider.getQuotaInfo();
    return {
      provider: provider.name,
      ...quotaInfo,
    };
  }
}
