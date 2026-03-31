import { Inject, Injectable } from '@nestjs/common';
import { AppConfig } from 'src/common/app-config/app.config';
import { ITextRecognitionProvider } from '../interfaces/text-recognition-provider.interface';
import { ProviderNotFoundException } from '../../exceptions/providerNotFound.exception';
import { NoAvailableProviderException } from '../../exceptions/noAvailableProvider.exception';

@Injectable()
export class TextRecognitionProviderFactory {
  constructor(
    @Inject('TEXT_RECOGNITION_PROVIDERS')
    private readonly providers: ITextRecognitionProvider[],
    private readonly appConfig: AppConfig,
  ) {}

  async getProvider(
    preferredProvider?: string,
  ): Promise<ITextRecognitionProvider> {
    const defaultProvider = this.appConfig.getDefaultRecognitionProvider();
    const providerName = preferredProvider || `${defaultProvider}-text`;

    const provider = this.providers.find((p) => p.name === providerName);
    if (!provider) {
      throw new ProviderNotFoundException(providerName);
    }

    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      const alternative = await this.findAvailableProvider();
      if (!alternative) {
        throw new NoAvailableProviderException();
      }
      return alternative;
    }

    return provider;
  }

  private async findAvailableProvider(): Promise<ITextRecognitionProvider | null> {
    for (const p of this.providers) {
      if (await p.isAvailable()) {
        return p;
      }
    }
    return null;
  }
}
