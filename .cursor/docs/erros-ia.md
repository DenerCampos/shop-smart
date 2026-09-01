# Erros do modelo de IA — SP-142

## Objetivo

Quando a chamada ao Gemini (texto, imagem, áudio ou chat) falhar, a API devolve um contrato HTTP estável para o cliente exibir toast: *“Falha no modelo de IA, tente mais tarde”*.

## Escopo

**Entra**
- Falha ao chamar o modelo, resposta vazia, JSON inválido ou output estruturado inutilizável
- Rotas síncronas de reconhecimento (despesa/receita imagem e áudio, lista de compras, cupom, receita médica, visão geral de saúde)
- Chat (`CHAT_AI_PROVIDER_ERROR` 502) continua com o código específico; o front trata os dois

**Fora**
- Quota diária (`ApiQuotaException` 429 `API Quota Exceeded`) — mensagem própria de limite
- Validação do cliente (arquivo vazio, texto vazio, MIME inválido) — 400
- Falha ao baixar HTML do cupom (portal fiscal) — não é falha do modelo

## Contrato

| Código | `error` | Quando |
|--------|---------|--------|
| 502 | `AI_PROVIDER_ERROR` | Falha do Gemini / parse da resposta |
| 502 | `CHAT_AI_PROVIDER_ERROR` | Idem no Assistente Familiar (já existia) |
| 429 | `API Quota Exceeded` | Limite diário do provedor |

Body 502:

```json
{
  "statusCode": 502,
  "error": "AI_PROVIDER_ERROR",
  "message": "Falha no modelo de IA. Tente mais tarde."
}
```

Detalhe técnico só em telemetria `ai_provider_call` (`ok: false`).

## Fluxo

1. Provider Gemini chama o modelo dentro de `AiCallTelemetryService.measure` — o erro **original** (timeout, JSON inválido, SDK) vai para `ai_provider_call` (`ok: false`)
2. Depois do `measure`, `measureThenWrapAiCall` / `wrapAiCallError` → `AiProviderException` (502 genérico ao cliente)
3. Service persiste tentativa `FAILED` (quando houver tabela de recognition) e relança
4. `AllExceptionsFilter` devolve o body 502

Exames de saúde em fila (`QUEUED` → worker): a falha do modelo marca o processamento `FAILED` (HTTP do upload já foi 201). O app mostra toast ao detectar a transição na lista de pendentes.

## Rotas afetadas

| Canal | Rotas |
|-------|--------|
| Imagem | `POST /expense/analyze-image`, `POST /revenue/analyze-image`, exames/receituário via `image-recognition` |
| Áudio | `POST /expense/analyze-audio`, `POST /revenue/analyze-audio` |
| Texto | `POST /shopping-lists/:id/items` (`useTextRecognition`), bulk items, `POST /coupon-reader`, `POST /health/ai-overview`, `POST /health/prescriptions/analyze` |
| Chat | `POST /chat-agent/sessions/:id/messages` |

## Arquivos-chave

| Arquivo | Papel |
|---------|--------|
| `src/common/ai-provider/ai-provider.exception.ts` | `AiProviderException` |
| `src/common/ai-provider/wrap-ai-call-error.ts` | `measureThenWrapAiCall` (telemetria com erro original) + `wrapAiCallError` (502; preserva 429 e 4xx) |
| Providers `gemini*.provider.ts` | Chamada Gemini |
| Services `*Recognition.service.ts` | Persistência FAILED + relançar |

## Testes

- Unit: `wrap-ai-call-error.spec.ts`, providers/services de recognition
- E2E: `test/e2e/ai-provider-error.e2e-spec.ts`

```bash
npm run test -- --testPathPattern=wrap-ai-call-error
npm run test -- --testPathPattern=textRecognition.service.spec
npm run test:e2e:low-mem -- --testPathPattern=ai-provider-error
```
