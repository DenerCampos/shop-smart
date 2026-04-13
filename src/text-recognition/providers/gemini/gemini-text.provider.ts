import { Injectable } from '@nestjs/common';
import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { AppConfig } from 'src/common/app-config/app.config';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { ShoppingListItemTextAiResult } from '../../types/textRecognitionType';
import { TextRecognitionException } from '../../exceptions/textRecognition.exception';
import { ApiQuotaException } from 'src/common/ai-quota/exceptions/apiQuota.exception';
import {
  CouponParseOptions,
  ITextRecognitionProvider,
  TextRecognitionAnalyzeOptions,
} from '../interfaces/text-recognition-provider.interface';
import { CouponTextResult } from '../../types/textRecognitionType';
import { AiCallTelemetryService } from 'src/common/logging/ai-call-telemetry.service';

/** Alinhado a shopping-list-item-unit (evita import do módulo shopping-list). */
const ALLOWED_UNITS = ['un', 'kg', 'g', 'l', 'ml', 'pack', 'dz'] as const;
type AllowedUnit = (typeof ALLOWED_UNITS)[number];

@Injectable()
export class GeminiTextProvider implements ITextRecognitionProvider {
  name = 'gemini-text';
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel | null;
  private readonly dailyLimit: number;

  constructor(
    private readonly appConfig: AppConfig,
    private readonly apiQuotaService: ApiQuotaService,
    private readonly aiCallTelemetry: AiCallTelemetryService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.appConfig.getGoogleApiKey());
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    this.dailyLimit = this.appConfig.getGeminiTextDailyLimit();
  }

  private cleanModelJson(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleaned.trim();
  }

  private coerceUnit(raw: unknown): AllowedUnit {
    const s =
      typeof raw === 'string' || typeof raw === 'number'
        ? String(raw).trim().toLowerCase()
        : 'un';
    const map: Record<string, AllowedUnit> = {
      un: 'un',
      unidade: 'un',
      unidades: 'un',
      kg: 'kg',
      quilograma: 'kg',
      quilogramas: 'kg',
      g: 'g',
      grama: 'g',
      gramas: 'g',
      l: 'l',
      litro: 'l',
      litros: 'l',
      ml: 'ml',
      mililitro: 'ml',
      mililitros: 'ml',
      pack: 'pack',
      pacote: 'pack',
      pacotes: 'pack',
      dz: 'dz',
      duzia: 'dz',
      duzias: 'dz',
    };
    const u =
      map[s] ??
      (ALLOWED_UNITS.includes(s as AllowedUnit) ? (s as AllowedUnit) : null);
    return u ?? 'un';
  }

  async analyze(
    text: string,
    options?: TextRecognitionAnalyzeOptions,
  ): Promise<ShoppingListItemTextAiResult> {
    return this.aiCallTelemetry.measure(
      'text_recognition',
      this.name,
      async () => {
        try {
          await this.apiQuotaService.checkAndIncrementQuota(
            this.name,
            this.dailyLimit,
          );

          const groupsList = options?.groups?.filter(Boolean) ?? [];
          const groupsCsv =
            groupsList.length > 0
              ? groupsList.join(', ')
              : '(nenhuma categoria cadastrada ainda)';

          const allowedUnits = ALLOWED_UNITS.join(', ');

          const prompt = `Você interpreta uma linha de item de lista de compras em português (ex.: "3x leite", "500g queijo mussarela", "2 pacotes de arroz").

Categorias já existentes do usuário (use uma delas quando fizer sentido; copie o nome exatamente como aparece na lista): ${groupsCsv}

Retorne APENAS um JSON válido (sem markdown, sem texto extra), com as chaves em inglês:
{
  "name": "nome do produto sem quantidade/unidade (ex.: Leite)",
  "quantity": número (mínimo 0.01, padrão 1 se não houver quantidade),
  "unit": uma destas strings exatas: ${allowedUnits},
  "group": {
    "name": "nome da categoria em português",
    "isNew": boolean
  }
}

Regras:
- "isNew": false quando a categoria adequada está na lista de categorias existentes; nesse caso "group.name" DEVE ser exatamente um dos nomes da lista (mesma grafia).
- "isNew": true quando nenhuma categoria existente serve; proponha um nome curto para a nova categoria em português (ex.: Alimentação, Limpeza).
- Se não houver categorias cadastradas, use "isNew": true com um nome razoável.
- Unidade: infira do texto (kg, g, l, ml, pacotes → pack, dúzias → dz, peças → un).
- Não inclua comentários nem blocos \`\`\`json.`;

          const result = await this.model.generateContent(
            `${prompt}\n\nTexto do usuário:\n${text}`,
          );

          const responseText = result.response.text();
          const cleaned = this.cleanModelJson(responseText);
          const parsed = JSON.parse(cleaned) as Record<string, unknown>;

          const nameRaw = parsed.name;
          if (typeof nameRaw !== 'string' || !nameRaw.trim()) {
            throw new TextRecognitionException(
              'Resposta da IA sem nome de produto válido.',
            );
          }

          let quantity = Number(parsed.quantity);
          if (!Number.isFinite(quantity) || quantity < 0.01) {
            quantity = 1;
          }

          const unit = this.coerceUnit(parsed.unit);

          const groupObj = parsed.group as Record<string, unknown> | undefined;
          const groupName =
            typeof groupObj?.name === 'string' && groupObj.name.trim()
              ? groupObj.name.trim()
              : 'Alimentação';
          const isNew = groupObj?.isNew === true || groupsList.length === 0;

          return {
            name: nameRaw.trim(),
            quantity,
            unit,
            group: {
              name: groupName,
              isNew: Boolean(isNew),
            },
            confidence: 0.85,
            provider: this.name,
          };
        } catch (error) {
          if (
            error instanceof TextRecognitionException ||
            error instanceof ApiQuotaException
          ) {
            throw error;
          }
          throw new TextRecognitionException(
            `Erro ao analisar texto: ${error.message}`,
          );
        }
      },
    );
  }

  async parseCoupon(
    text: string,
    options?: CouponParseOptions,
  ): Promise<CouponTextResult> {
    try {
      await this.apiQuotaService.checkAndIncrementQuota(
        this.name,
        this.dailyLimit,
      );

      const groups =
        options?.groups?.filter(Boolean).join(', ') ||
        'Alimentação, Bebida, Limpeza, Higiene, Outros';
      const payment = options?.defaultPayment || 'Cartão de crédito';

      const prompt = `Analise o texto abaixo de um cupom fiscal ou nota fiscal eletrônica e extraia as seguintes informações em formato JSON:
- name: nome do estabelecimento
- value: valor total da nota (número)
- date: data da compra (formato: YYYY-MM-DD), se não for possível identificar, retorne a data atual no Brasil/America do Sul
- repeat: sempre false
- items: array de produtos, cada item deve conter:
  * code: código do produto, se não for possível identificar, retorne '1'
  * name: nome do produto formatado. 
    IMPORTANTE: Converta o nome para "Title Case" (apenas iniciais maiúsculas), remova abreviações excessivas e tente deduzir o nome completo e amigável do produto (ex: de 'MAC VILM OV ESP' para 'Macarrão de Ovos Vilma Especial'). 
    Ao expandir abreviações, use apenas o contexto presente no texto. Se não tiver certeza absoluta do nome completo, apenas converta para 'Title Case' e remova caracteres especiais.
    Mantenha informações de peso/volume (ex: 500g, 1L).
  * quantity: quantidade (número), se não for possível identificar, retorne 0
  * unit: unidade - use 'unidade' para UN, 'quilograma' para KG, ou 'pacote' para PT, se não for possível identificar, retorne 'unidade'
  * value: valor unitário (número), se não for possível identificar, retorne 0
  * total: valor total do item (número), se não for possível identificar, retorne 0
  * group: objeto com a propriedade 'name' contendo o nome do grupo de classificação. Os grupos possíveis são: ${groups}
- store: objeto com a propriedade 'name' contendo o nome do estabelecimento
- payment: objeto com a propriedade 'name' contendo o nome do método de pagamento. Se não for possível identificar, use '${payment}'

IMPORTANTE: Todas as chaves devem estar em inglês (code, name, quantity, unit, value, total, group, store, payment).
Retorne apenas o JSON, sem explicações adicionais.

Texto do cupom:
${text}`;

      const result = await this.model.generateContent(prompt);
      const responseText = result.response.text();
      const cleaned = this.cleanModelJson(responseText);
      const parsed = JSON.parse(cleaned) as Record<string, unknown>;

      if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
        throw new TextRecognitionException(
          'Resposta da IA sem nome de estabelecimento válido.',
        );
      }
      if (typeof parsed.value !== 'number') {
        throw new TextRecognitionException(
          'Resposta da IA com valor total inválido.',
        );
      }
      if (!Array.isArray(parsed.items)) {
        throw new TextRecognitionException(
          'Resposta da IA sem lista de itens.',
        );
      }

      return {
        ...(parsed as unknown as CouponTextResult),
        provider: this.name,
        confidence: 0.9,
      };
    } catch (error) {
      if (
        error instanceof TextRecognitionException ||
        error instanceof ApiQuotaException
      ) {
        throw error;
      }
      throw new TextRecognitionException(
        `Erro ao analisar texto do cupom: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const apiKey = this.appConfig.getGoogleApiKey();
      if (!apiKey) {
        return false;
      }
      const usage = await this.apiQuotaService.getCurrentUsage(this.name);
      return usage.dailyLimit === 0 || usage.remaining > 0;
    } catch {
      return false;
    }
  }

  async getQuotaInfo(): Promise<{
    requestCount: number;
    dailyLimit: number;
    remaining: number;
  }> {
    return this.apiQuotaService.getCurrentUsage(this.name);
  }
}
