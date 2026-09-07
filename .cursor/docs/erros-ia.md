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

## Retry e fallback (visão — SP-144)

Em `image-recognition` (foto de despesa/receita, exames, receituário), um **503 / 504 / sobrecarga** do Gemini não cai direto no 502. A API tenta, nesta ordem:

1. `gemini-3.5-flash-lite`
2. `gemini-3.5-flash`
3. `gemini-2.5-flash` (legado; ainda usado em chat/texto)

**503 / 504 / overloaded:** 2 tentativas **por modelo**, com backoff **linear** (`delayMs * (attempt + 1)`): ~700 ms após a 1ª falha, ~1400 ms após a 2ª (e o mesmo padrão ao passar para o próximo modelo). Pior caso de espera extra ≈ 5 s, **além** das round-trips Gemini.

**429 / rate-limit** (`resource_exhausted`, `too many requests`): **não** repete o mesmo modelo — 1 tentativa e cai no próximo da lista, sem pausa. Evita aprofundar o rate-limit da API key (até 3 chamadas, não 6).

**404 / modelo descontinuado** (`no longer available`) pula na hora para o próximo da lista, sem repetir o modelo morto. Erro de parse, 400 ou chave inválida **não** faz retry. Quota diária nossa continua 1 incremento por request do usuário (não por tentativa).

Evento Loki `ai_gemini_vision` (sucesso **e** falha da cadeia): `ok`, `feature` (`image_recognition` | `health_exam` | `health_imaging` | `prescription`), `model_used`, `attempts`, `fallback`. Chat, lista de compras e áudio não usam essa cadeia.

Se todos os modelos falharem, o contrato HTTP continua 502 `AI_PROVIDER_ERROR`.

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
| `src/common/ai-provider/gemini-retry-fallback.ts` | Retry 503/504 + fallback; 429 só troca de modelo (SP-144) |
| Providers `gemini*.provider.ts` | Chamada Gemini |
| Services `*Recognition.service.ts` | Persistência FAILED + relançar |

## Testes

- Unit: `gemini-retry-fallback.spec.ts`, `wrap-ai-call-error.spec.ts`, providers/services de recognition
- E2E: `test/e2e/ai-provider-error.e2e-spec.ts`

```bash
npm run test -- --testPathPattern=gemini-retry-fallback
npm run test -- --testPathPattern=wrap-ai-call-error
npm run test -- --testPathPattern=textRecognition.service.spec
npm run test:e2e:low-mem -- --testPathPattern=ai-provider-error
```
