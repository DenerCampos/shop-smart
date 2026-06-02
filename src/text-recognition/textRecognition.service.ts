import { Inject, Injectable } from '@nestjs/common';
import { AppConfig } from 'src/common/app-config/app.config';
import { User } from 'src/user/entities/user.entity';
import { GroupService } from 'src/group/group.service';
import { TextRecognitionProviderFactory } from './providers/factory/text-recognition-provider.factory';
import { ITextRecognitionRepository } from './interfaces/textRecognition.repository.interface';
import {
  CouponTextResult,
  ParsedShoppingListItemFromText,
  ShoppingListItemTextAiResult,
  TextRecognitionStatus,
} from './types/textRecognitionType';
import { TextRecognitionException } from './exceptions/textRecognition.exception';
import { normalizeShoppingListItemUnit } from 'src/shopping-list/utils/normalize-shopping-list-item-unit';
import { ApiQuotaException } from 'src/common/ai-quota/exceptions/apiQuota.exception';

@Injectable()
export class TextRecognitionService {
  constructor(
    @Inject('ITextRecognitionRepository')
    private readonly textRecognitionRepository: ITextRecognitionRepository,
    private readonly groupService: GroupService,
    private readonly appConfig: AppConfig,
    private readonly providerFactory: TextRecognitionProviderFactory,
  ) {}

  /**
   * Interpreta texto livre de item de lista de compras (Gemini + categorias do usuário).
   * Persiste tentativa em `text_recognition` (sucesso ou falha).
   */
  async parseShoppingListItem(
    rawText: string,
    user: User,
  ): Promise<ParsedShoppingListItemFromText> {
    const trimmed = rawText?.trim();
    if (!trimmed) {
      throw new TextRecognitionException('Texto vazio para interpretação.');
    }

    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider() + '-text',
    );

    const groups = await this.groupService.findAllNames(user);

    try {
      const ai = await provider.analyze(trimmed, { groups });

      await this.textRecognitionRepository.create(
        {
          sourceText: trimmed,
          provider: provider.name,
          confidence: ai.confidence,
          result: ai,
          status: TextRecognitionStatus.COMPLETED,
        },
        user,
      );

      const unit = normalizeShoppingListItemUnit(ai.unit);
      const groupId = await this.resolveGroupId(ai.group, user);

      return {
        name: ai.name,
        quantity: ai.quantity,
        unit,
        groupId,
      };
    } catch (error) {
      await this.textRecognitionRepository.create(
        {
          sourceText: trimmed,
          provider: provider.name,
          confidence: 0,
          result: null,
          status: TextRecognitionStatus.FAILED,
          error: error instanceof Error ? error.message : String(error),
        },
        user,
      );

      if (
        error instanceof TextRecognitionException ||
        error instanceof ApiQuotaException
      ) {
        throw error;
      }

      throw new TextRecognitionException(
        `Falha ao interpretar item: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Interpreta vários produtos em um texto (vírgulas etc.).
   * Uma entrada em text_recognition com o resultado agregado.
   */
  async parseShoppingListItems(
    rawText: string,
    user: User,
  ): Promise<ParsedShoppingListItemFromText[]> {
    const trimmed = rawText?.trim();
    if (!trimmed) {
      throw new TextRecognitionException('Texto vazio para interpretação.');
    }

    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider() + '-text',
    );

    const groups = await this.groupService.findAllNames(user);

    try {
      let aiResults: ShoppingListItemTextAiResult[];

      if (typeof provider.analyzeBulk === 'function') {
        const bulk = await provider.analyzeBulk(trimmed, { groups });
        aiResults = bulk.items;
      } else {
        const segments = trimmed
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (segments.length === 0) {
          throw new TextRecognitionException('Nenhum item para interpretar.');
        }
        aiResults = [];
        for (const seg of segments) {
          aiResults.push(await provider.analyze(seg, { groups }));
        }
      }

      if (!aiResults.length) {
        throw new TextRecognitionException(
          'Nenhum item foi interpretado pelo provedor.',
        );
      }

      const avgConfidence =
        aiResults.reduce((sum, r) => sum + r.confidence, 0) / aiResults.length;

      await this.textRecognitionRepository.create(
        {
          sourceText: trimmed,
          provider: provider.name,
          confidence: avgConfidence,
          result: { items: aiResults },
          status: TextRecognitionStatus.COMPLETED,
        },
        user,
      );

      const out: ParsedShoppingListItemFromText[] = [];
      for (const ai of aiResults) {
        const unit = normalizeShoppingListItemUnit(ai.unit);
        const groupId = await this.resolveGroupId(ai.group, user);
        out.push({
          name: ai.name,
          quantity: ai.quantity,
          unit,
          groupId,
        });
      }
      return out;
    } catch (error) {
      await this.textRecognitionRepository.create(
        {
          sourceText: trimmed,
          provider: provider.name,
          confidence: 0,
          result: null,
          status: TextRecognitionStatus.FAILED,
          error: error instanceof Error ? error.message : String(error),
        },
        user,
      );

      if (
        error instanceof TextRecognitionException ||
        error instanceof ApiQuotaException
      ) {
        throw error;
      }

      throw new TextRecognitionException(
        `Falha ao interpretar lista de itens: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async resolveGroupId(
    group: { name: string; isNew: boolean },
    user: User,
  ): Promise<string | undefined> {
    const name = group.name?.trim();
    if (!name) {
      return undefined;
    }

    if (group.isNew) {
      const created = await this.groupService.create({ name }, user);
      return created.id;
    }

    let found = await this.groupService.findByName(name, user);
    if (found) {
      return found.id;
    }

    const allNames = await this.groupService.findAllNames(user);
    const lower = name.toLowerCase();
    const exact = allNames.find((n) => n.trim().toLowerCase() === lower);
    if (exact) {
      found = await this.groupService.findByName(exact, user);
      if (found) {
        return found.id;
      }
    }

    const created = await this.groupService.create({ name }, user);
    return created.id;
  }

  async parseCoupon(text: string, user: User): Promise<CouponTextResult> {
    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider() + '-text',
    );

    const groups = await this.groupService.findAllNames(user);

    try {
      const result = await provider.parseCoupon(text, { groups });

      await this.textRecognitionRepository.create(
        {
          sourceText: text.slice(0, 500),
          provider: provider.name,
          confidence: result.confidence,
          result: result,
          status: TextRecognitionStatus.COMPLETED,
        },
        user,
      );

      return result;
    } catch (error) {
      await this.textRecognitionRepository.create(
        {
          sourceText: text.slice(0, 500),
          provider: provider.name,
          confidence: 0,
          result: null,
          status: TextRecognitionStatus.FAILED,
          error: error instanceof Error ? error.message : String(error),
        },
        user,
      );

      if (
        error instanceof TextRecognitionException ||
        error instanceof ApiQuotaException
      ) {
        throw error;
      }

      throw new TextRecognitionException(
        `Falha ao processar cupom: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getProviderQuota(): Promise<{
    provider: string;
    requestCount: number;
    dailyLimit: number;
    remaining: number;
  }> {
    const provider = await this.providerFactory.getProvider(
      this.appConfig.getDefaultRecognitionProvider() + '-text',
    );

    const quotaInfo = await provider.getQuotaInfo();
    return {
      provider: provider.name,
      ...quotaInfo,
    };
  }
}
