import { Injectable } from '@nestjs/common';
import {
  Content,
  FunctionCallingMode,
  GenerateContentResult,
  GenerativeModel,
  GoogleGenerativeAI,
  Part,
} from '@google/generative-ai';
import { AppConfig } from 'src/common/app-config/app.config';
import { ApiQuotaService } from 'src/common/ai-quota/services/apiQuota.service';
import { AiCallTelemetryService } from 'src/common/logging/ai-call-telemetry.service';
import { CHAT_TOOL_DECLARATIONS } from '../tools/chat-tool.declarations';
import { ChatToolsService } from '../tools/chat-tools.service';
import { ChatAuthContext } from '../types/chat-auth-context.type';
import { ChatAiProviderException } from '../exceptions/chat-agent.exception';
import { ApiQuotaException } from 'src/common/ai-quota/exceptions/apiQuota.exception';

const MAX_TOOL_ROUNDS = 5;

export type GeminiChatTurn = {
  role: 'user' | 'model';
  text: string;
};

export type GeminiChatResult = {
  text: string;
  toolTrace: Array<{ name: string; ok: boolean }>;
};

@Injectable()
export class GeminiChatProvider {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel | null;
  private readonly dailyLimit: number;

  constructor(
    private readonly appConfig: AppConfig,
    private readonly apiQuotaService: ApiQuotaService,
    private readonly aiCallTelemetry: AiCallTelemetryService,
    private readonly chatTools: ChatToolsService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.appConfig.getGoogleApiKey());
    const key = this.appConfig.getGoogleApiKey();
    this.model = key
      ? this.genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          tools: [{ functionDeclarations: CHAT_TOOL_DECLARATIONS }],
          toolConfig: {
            functionCallingConfig: { mode: FunctionCallingMode.AUTO },
          },
        })
      : null;
    this.dailyLimit = this.appConfig.getGeminiChatDailyLimit();
  }

  /**
   * Valida configuração e quota sem consumir o contador.
   * Chamar antes de persistir a mensagem do usuário.
   */
  async assertCanStartTurn(): Promise<void> {
    if (!this.model) {
      throw new ChatAiProviderException(
        'Assistente de IA não configurado (GOOGLE_API_KEY).',
      );
    }
    await this.apiQuotaService.assertQuotaAvailable(
      'gemini-chat',
      this.dailyLimit,
    );
  }

  async ask(input: {
    systemPrompt: string;
    history: GeminiChatTurn[];
    userMessage: string;
    auth: ChatAuthContext;
  }): Promise<GeminiChatResult> {
    await this.assertCanStartTurn();

    await this.apiQuotaService.checkAndIncrementQuota(
      'gemini-chat',
      this.dailyLimit,
    );

    const toolTrace: Array<{ name: string; ok: boolean }> = [];
    const toolResults: Array<{ name: string; result: unknown }> = [];
    const history: Content[] = input.history.map((h) => ({
      role: h.role,
      parts: [{ text: h.text }],
    }));

    try {
      return await this.aiCallTelemetry.measure(
        'chat_agent',
        'gemini-chat',
        async () => {
          const model = this.model;
          if (!model) {
            throw new ChatAiProviderException(
              'Assistente de IA não configurado (GOOGLE_API_KEY).',
            );
          }

          const systemInstruction: Content = {
            role: 'system',
            parts: [{ text: input.systemPrompt }],
          };

          const chat = model.startChat({
            history,
            systemInstruction,
          });

          let response = await chat.sendMessage(input.userMessage);
          let rounds = 0;

          while (rounds < MAX_TOOL_ROUNDS) {
            const calls = response.response.functionCalls();
            if (!calls?.length) {
              break;
            }

            const parts: Part[] = [];
            for (const call of calls) {
              const args = (call.args ?? {}) as Record<string, unknown>;
              const result = await this.chatTools.execute(
                call.name,
                args,
                input.auth,
              );
              const ok = !(
                result &&
                typeof result === 'object' &&
                'error' in (result as object)
              );
              toolTrace.push({ name: call.name, ok });
              toolResults.push({ name: call.name, result });
              parts.push({
                functionResponse: {
                  name: call.name,
                  response: { result },
                },
              });
            }

            response = await chat.sendMessage(parts);
            rounds += 1;
          }

          let text = this.extractText(response);

          // Gemini às vezes encerra só com functionCall / texto vazio após tools.
          if (!text) {
            await this.apiQuotaService.checkAndIncrementQuota(
              'gemini-chat',
              this.dailyLimit,
            );
            text = await this.synthesizeAnswer({
              systemInstruction,
              userMessage: input.userMessage,
              toolResults,
            });
          }

          if (!text) {
            throw new ChatAiProviderException(
              'A IA não retornou uma resposta textual.',
            );
          }

          return { text, toolTrace };
        },
      );
    } catch (err) {
      if (err instanceof ApiQuotaException) throw err;
      if (err instanceof ChatAiProviderException) throw err;
      // Detalhe já vai em ai_provider_call (telemetry); cliente só vê mensagem genérica.
      throw new ChatAiProviderException();
    }
  }

  private extractText(result: GenerateContentResult): string {
    try {
      const direct = result.response.text()?.trim();
      if (direct) return direct;
    } catch {
      // text() lança quando a resposta só tem functionCall / bloqueio
    }

    const parts = result.response.candidates?.[0]?.content?.parts ?? [];
    return parts
      .map((p) => ('text' in p && p.text ? p.text : ''))
      .join('\n')
      .trim();
  }

  /** Gera resposta final sem tools (FunctionCallingMode.NONE). */
  private async synthesizeAnswer(input: {
    systemInstruction: Content;
    userMessage: string;
    toolResults: Array<{ name: string; result: unknown }>;
  }): Promise<string> {
    const key = this.appConfig.getGoogleApiKey();
    if (!key) return '';

    const synthesizer = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: input.systemInstruction,
      toolConfig: {
        functionCallingConfig: { mode: FunctionCallingMode.NONE },
      },
    });

    const payload =
      input.toolResults.length > 0
        ? JSON.stringify(input.toolResults).slice(0, 12000)
        : 'Nenhuma ferramenta foi executada com sucesso.';

    const prompt = `Pergunta do usuário:
${input.userMessage}

Resultados das ferramentas (JSON):
${payload}

Com base APENAS nesses dados, responda em português brasileiro de forma clara e objetiva.
Se os dados estiverem vazios ou com erro, diga isso honestamente.
Não invente valores. Não mencione IDs internos.`;

    const result = await synthesizer.generateContent(prompt);
    return this.extractText(result);
  }
}
