import { Inject, Injectable } from '@nestjs/common';
import { IImageRecognitionProvider } from '../interfaces/image-recognition-provider.interface';
import { ProviderNotFoundException } from '../../exceptions/providerNotFound.exception';
import { NoAvailableProviderException } from '../../exceptions/noAvailableProvider.exception';
import { AppConfig } from 'src/common/app-config/app.config';

@Injectable()
export class ImageRecognitionProviderFactory {
  constructor(
    @Inject('RECOGNITION_PROVIDERS')
    private providers: IImageRecognitionProvider[],
    private readonly appConfig: AppConfig,
  ) {}

  async getProvider(
    preferredProvider?: string,
  ): Promise<IImageRecognitionProvider> {
    const defaultProvider = this.appConfig.getDefaultRecognitionProvider();
    const providerName = preferredProvider || defaultProvider;

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

  private async findAvailableProvider(): Promise<IImageRecognitionProvider | null> {
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        // Provider alternativo encontrado
        return provider;
      }
    }
    return null;
  }
}
