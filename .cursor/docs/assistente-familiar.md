# Assistente Familiar (Chat Agent) — SP-117

## Objetivo

Permitir que o usuário autenticado faça perguntas em linguagem natural sobre os dados do Super Family Quest (somente leitura), com respostas geradas por Gemini (`function calling`) sobre tools tipadas que reutilizam os services existentes.

## Escopo

**Entra**
- Chat com histórico persistido (`chat_session` / `chat_message`)
- Tools read-only de todos os módulos queryáveis (família, financeiro, relatórios, lista de compras, chores/mesada, moedas, missões, temas, saúde, receitas culinárias, integrações/quota)
- ACL: admin da família pode consultar qualquer membro aceito; member/solo só dados próprios + compartilhados (shopping/chores próprias/saúde/recipes do grupo)
- Quota `GEMINI_CHAT_DAILY_LIMIT` + telemetria `ai_provider_call` (`feature: chat_agent`)

**Fora**
- Escrita (criar/editar/aprovar)
- Text-to-SQL livre
- Streaming SSE
- Seletor de membro na UI (membro via linguagem natural nas tools)

## Fluxo

1. Front cria sessão `POST /chat-agent/sessions`
2. Usuário envia pergunta `POST /chat-agent/sessions/:id/messages` com `screenContext` opcional
3. `ChatAgentService` monta `ChatAuthContext` via `FamilyMemberResolverService`
4. `GeminiChatProvider` chama Gemini com system prompt + tools
5. Modelo pede function calls → `ChatToolsService` executa services de domínio
6. Resposta textual é persistida e devolvida ao cliente

`screenContext` entra no system prompt delimitado (`<<<SCREEN_CONTEXT ... SCREEN_CONTEXT>>>`) como metadado de UI **não confiável** — o modelo deve usá-lo só como dica de assunto, nunca como instrução.

`get_expense_receipt` devolve resumo (itens, valores, loja/pagamento) **sem** `uri`/`photos`; sanitização também remove essas chaves de qualquer tool result.

## Contratos HTTP

Todos com `AuthGuard`.

| Método | Rota | Body / notas |
|--------|------|----------------|
| POST | `/chat-agent/sessions` | `{ title? }` |
| GET | `/chat-agent/sessions` | lista do usuário |
| GET | `/chat-agent/sessions/:id/messages` | histórico paginado (`page`, `limit` default 20) → `{ data, meta, links }`; página 1 = mais recentes |
| POST | `/chat-agent/sessions/:id/messages` | `{ message, screenContext? }` → `{ userMessage, assistantMessage }` |
| DELETE | `/chat-agent/sessions/:id` | soft delete (204) |

### Erros de IA

| Código | `error` | Quando |
|--------|---------|--------|
| 429 | `API Quota Exceeded` | `ApiQuotaException` (`gemini-chat`) — checado **antes** de persistir a mensagem do usuário |
| 502 | `CHAT_AI_PROVIDER_ERROR` | falha Gemini / resposta vazia (mensagem genérica ao cliente; detalhe só em `ai_provider_call`). A mensagem do usuário **já foi persistida** e permanece no histórico |

Antes de `POST .../messages` gravar o turno do usuário, `GeminiChatProvider.assertCanStartTurn()` valida `GOOGLE_API_KEY` e quota (sem consumir o contador). O incremento ocorre só ao iniciar a chamada Gemini.

## Regras de negócio / ACL

| Domínio | Admin | Member / solo |
|---------|-------|----------------|
| Financeiro, moedas, missões, relatórios | Família (via `memberName` ou all) | Só próprio |
| Shopping lists do grupo, recipes do grupo, saúde (leitura) | Grupo | Shared conforme módulo |
| Chores | Todas / aprovações / payroll | Só assigned / pending próprio |
| Família (membros) | Todos | Filtro da API (member não vê admins na listagem) |

Desambiguação de **“receita”** no prompt: financeira × médica × culinária.

`search_expense_items` limita a **100 despesas** mais recentes do período (`ORDER BY date DESC`) e até **100 itens** no resultado (`truncated: true` quando corta).

## Arquivos-chave

| Path | Papel |
|------|-------|
| `src/chat-agent/` | Módulo Nest |
| `src/chat-agent/tools/chat-tool.declarations.ts` | Schemas Gemini |
| `src/chat-agent/tools/chat-tools.service.ts` | Execução + ACL |
| `src/chat-agent/providers/gemini-chat.provider.ts` | Loop function calling |
| `src/common/prompts/chat-agent.prompt.ts` | System prompt |
| `db/migrations/1775800000000-AddChatAgentTables.ts` | Tabelas |

**Dependências:** `ChatAgentModule` → módulos de domínio. Domínios **nunca** importam `ChatAgentModule`.

## Obrigatório em novos módulos

Ao criar ou alterar um módulo com dados pesquisáveis pelo usuário:

1. Adicionar/atualizar tool(s) read-only em `chat-agent/tools/` (declaração + handler)
2. Ajustar prompt se houver ambiguidade de vocabulário
3. Atualizar esta doc (lista de tools)
4. Cobrir ACL em teste unitário quando houver regra nova

## Tools (catálogo)

`get_current_user`, `list_family_members`, `list_pending_invitations`, `get_family_summary`, `list_latest_registrations`, `list_expenses`, `search_expense_items`, `summarize_expenses`, `get_expense`, `get_expense_receipt`, `list_revenues`, `summarize_revenues`, `get_revenue`, `get_month_balance`, `list_pending_recurring`, `list_stores`, `list_categories`, `list_payments`, `report_expense_by_category`, `report_expense_by_store`, `report_expense_by_date`, `report_most_purchased_items`, `report_expenses_vs_income`, `list_warranties`, `list_shopping_lists`, `get_shopping_list`, `search_shopping_suggestions`, `list_chore_definitions`, `search_chores`, `list_pending_approvals`, `get_payroll_pending`, `get_payroll_settlement`, `get_coin_balance`, `get_coin_statement`, `list_missions`, `list_themes`, `list_health_exams`, `get_lab_item_evolution`, `list_prescriptions`, `get_medication_schedule`, `get_health_ai_overview`, `list_recipes`, `get_recipe`, `get_alexa_status`, `get_ai_quota`.

## Testes

```bash
# unit
npm test -- --testPathPattern=chat-tools.service.spec

# e2e (mock GeminiChatProvider)
npm run test:e2e:low-mem -- --testPathPattern=chat-agent.e2e-spec
```

## Env

- `GOOGLE_API_KEY`
- `GEMINI_CHAT_DAILY_LIMIT` (default 50)

## Rate limit

Rotas do Assistente Familiar (`/chat-agent/*`) usam `@Throttle` de **20 req/min** (igual às demais rotas de IA: analyze image/audio, upload saúde, ai-overview).
