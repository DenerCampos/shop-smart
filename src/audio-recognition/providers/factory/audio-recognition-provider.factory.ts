import { Inject, Injectable } from '@nestjs/common';
import { IAudioRecognitionProvider } from '../interfaces/audio-recognition-provider.interface';
import { ProviderNotFoundException } from '../../exceptions/providerNotFound.exception';
import { NoAvailableProviderException } from '../../exceptions/noAvailableProvider.exception';
import { AppConfig } from 'src/common/app-config/app.config';

@Injectable()
export class AudioRecognitionProviderFactory {
  constructor(
    @Inject('AUDIO_RECOGNITION_PROVIDERS')
    private readonly providers: IAudioRecognitionProvider[],
    private readonly appConfig: AppConfig,
  ) {}

  async getProvider(
    preferredProvider?: string,
  ): Promise<IAudioRecognitionProvider> {
    const defaultProvider = this.appConfig.getDefaultRecognitionProvider();
    const providerName = preferredProvider || `${defaultProvider}-audio`;

    const provider = this.providers.find((p) => p.name === providerName);
    if (!provider) {
      // Provider não encontrado
      throw new ProviderNotFoundException(providerName);
    }

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      // Provider não está disponível, tentando alternativas
      const alternativeProvider = await this.findAvailableProvider();
      if (!alternativeProvider) {
        throw new NoAvailableProviderException();
      }
      return alternativeProvider;
    }

    return provider;
  }

  private async findAvailableProvider(): Promise<IAudioRecognitionProvider | null> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        // Provider alternativo encontrado
        return provider;
      }
    }
    return null;
  }
}
