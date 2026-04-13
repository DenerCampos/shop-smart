import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { findSimilarString } from 'src/common/utils/similarString.util';
import { StoreService } from 'src/store/store.service';
import { TextRecognitionService } from 'src/text-recognition/textRecognition.service';
import { User } from 'src/user/entities/user.entity';
import { CouponTextResult } from 'src/text-recognition/types/textRecognitionType';

const AXIOS_TIMEOUT_MS = 15000;

@Injectable()
export class CouponReaderService {
  constructor(
    private readonly storeService: StoreService,
    private readonly textRecognitionService: TextRecognitionService,
  ) {}

  async read(
    url: string,
    user: User,
  ): Promise<CouponTextResult & { uri: string }> {
    const text = await this.fetchCouponText(url);

    const [result, storesNames] = await Promise.all([
      this.textRecognitionService.parseCoupon(text, user),
      this.storeService.getAllNames(),
    ]);

    const similarityName = findSimilarString(result.name, storesNames);

    if (similarityName) {
      return {
        ...result,
        name: similarityName.match,
        store: { name: similarityName.match },
        uri: url,
      };
    }

    return { ...result, uri: url };
  }

  private async fetchCouponText(url: string): Promise<string> {
    let html: string;

    try {
      const response = await axios.get<string>(url, {
        timeout: AXIOS_TIMEOUT_MS,
      });
      html = response.data;
    } catch {
      throw new InternalServerErrorException(
        'Não foi possível acessar o portal do cupom. Verifique a URL e tente novamente.',
      );
    }

    const $ = cheerio.load(html);
    const text = $('.container').text().replace(/\s+/g, ' ').trim();

    if (!text) {
      throw new BadRequestException(
        'Não foi possível extrair texto do cupom. Verifique se a URL é de um portal fiscal válido.',
      );
    }

    return text;
  }
}
