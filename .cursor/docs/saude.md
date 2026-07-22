# Módulo de Saúde — SP-123 / SP-124 / SP-125

## Objetivo

Permitir que membros de um grupo familiar cadastrem, organizem e visualizem exames médicos, receituários e obtenham um relatório de saúde gerado por IA (Gemini), com suporte a upload de PDFs e imagens. Inclui série temporal de itens laboratoriais.

---

## Escopo

**Inclui:**
- Cadastro manual de exames (laboratorial, imagem, funcional, procedimento)
- Upload de PDFs e imagens de exames para processamento automático via IA
- Revisão e aprovação dos dados extraídos pela IA antes de salvar
- Busca de exames com filtros (nome, médico, laboratório, data, tipo)
- Evolução temporal por nome de item laboratorial (endpoints `exam-items/names` e `exam-items/evolution`)
- Visão geral de saúde gerada por Gemini (relatório em cache, regenerável)
- Cadastro, listagem e detalhe de receituários com horários e agendamento estruturado
- Permissões familiares: admin gerencia qualquer membro; membros gerenciam apenas os seus

**Não inclui (versão inicial):**
- Prontuário completo / histórico médico geral
- Agendamento de consultas
- Integração com planos de saúde
- Notificações de medicamentos (push)

---

## Fluxo

### Cadastro Manual
1. Usuário acessa `/new-resources/health/register`
2. Seleciona aba "Manual"
3. Preenche tipo, laboratório, médico, data, itens (resultados ou laudo)
4. Salva → POST `/health/exams` → exame com status `APPROVED`

### Upload de PDF/Imagem
1. Usuário seleciona aba "PDF/Imagem"
2. Seleciona múltiplos arquivos (PDF, JPG, PNG — máx. **10 MB** por arquivo, validado no cliente)
3. Clica em "Enviar ao Processamento" → POST `/health/upload`
4. API salva arquivo no Supabase Storage (pasta `health/`) e cria registro em `health_exam_processing` com status `QUEUED`
5. Cron job (`*/2 * * * *`) processa até 3 arquivos por vez (QUEUED + FAILED elegíveis após **2 horas** — constante `HEALTH_PROCESSING_AUTO_RETRY_AFTER_MS`):
   - PDF com texto extraível → `pdf-parse` + prompt laboratorial para Gemini
   - PDF com imagens / arquivo de imagem → envia base64 + prompt de laudo para Gemini
6. Registro atualizado para `COMPLETED` com dados em `extractedData`
7. Usuário acessa `/new-resources/health/pending`, vê lista de arquivos (todos os status: fila, processando, concluídos e falhas)
8. Clica no item → `/new-resources/health/pending/:id` → revisa dados extraídos, edita se necessário
9. Salva → POST `/health/processing/:id/approve` → cria `health_exam` com itens + arquivo vinculado, remove processamento

### Busca
- `/new-resources/health/search` com filtros independentes
- Resultado em lista expansível; item anormal com badge laranja
- Evolução temporal **não** fica embutida na busca

### Evolução (SP-124)
1. App lista nomes via GET `/health/exam-items/names?userId=&search=`
2. Ao escolher um item → GET `/health/exam-items/evolution?itemName=&userId=&dateFrom=&dateTo=`
3. Backend retorna pontos de exames `LABORATORY` + `APPROVED` com `resultValue` não vazio, ordenados por `examDate` ASC
4. Front filtra valores numéricos e renderiza o gráfico

### Visão Geral (IA)
1. Usuário acessa `/new-resources/health/overview`
2. Seleciona membro (se admin)
3. (Opcional) Preenche campo de **informações adicionais** sobre o paciente — sintomas, relatos de consultas, doenças conhecidas/suspeitas
4. Clica "Gerar Relatório" → POST `/health/ai-overview` com `{ targetUserId?, patientContext? }`
5. Se `patientContext` informado, salvo em `health_patient_context` (histórico com data)
6. **Geração incremental:**
   - **1º relatório** (nenhum anterior): envia **tudo** — todos os exames aprovados + todo o histórico de contexto + último receituário. Se não houver nenhum dado, retorna 400.
   - **2º em diante**: envia apenas o que é **novo desde a data (`generatedAt`) do último relatório** — exames criados/atualizados após essa data + contextos criados após essa data + **último receituário** (sempre) + o **conteúdo do relatório anterior** (para a IA consolidar/atualizar).
   - Se **não houver** exames novos, contextos novos nem receituário novo → **não gera** e retorna o último relatório existente (sem chamar a IA).
7. Gemini gera relatório em Markdown com seções de saúde (incl. `## Medicamentos em Uso`)
8. Resultado salvo em `health_ai_overview` (uma nova linha por geração)
9. Próximas visitas carregam do cache via GET `/health/ai-overview/latest` e histórico via GET `/health/patient-context`

### Receituário
- Listagem: GET `/health/prescriptions` com filtro por membro
- Novo: formulário com médico, data, itens (medicamento, dosagem, horários, dias da semana, datas início/fim)
- **Análise com IA:** POST `/health/prescriptions/analyze` recebe foto ou PDF; PDF com texto → `text-recognition`; imagem/PDF escaneado → `image-recognition`; retorna campos extraídos para preenchimento no app
- Detalhe: exibe medicamentos com status (em uso / concluído)
- Edição e exclusão disponíveis

---

## Contratos HTTP

### Exames
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/health/exams` | Cadastro manual |
| GET | `/health/exams` | Listagem com filtros |
| GET | `/health/exams/:id` | Detalhe |
| PUT | `/health/exams/:id` | Atualização |
| DELETE | `/health/exams/:id` | Exclusão (soft delete) |
| GET | `/health/exam-items/names?userId=&search=` | Nomes distintos de itens laboratoriais com valor (formatados: 1ª maiúscula + resto minúsculo; `search` case-insensitive; dedupe por caixa) |
| GET | `/health/exam-items/evolution?itemName=&userId=&dateFrom=&dateTo=` | Série temporal do item (ASC por `examDate`; match de `itemName` case-insensitive) |

### Upload / Processamento
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/health/upload` | Upload multipart (até 20 arquivos) |
| GET | `/health/processing` | Lista processamentos do usuário/grupo (todos os status: `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`) |
| GET | `/health/processing/:id` | Detalhe |
| POST | `/health/processing/:id/approve` | Aprovar e criar exame (somente status `COMPLETED`) |
| POST | `/health/processing/:id/retry` | Reenfileirar item `FAILED` (processado pelo cron) |
| DELETE | `/health/processing/:id` | Descartar |

### Visão Geral
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/health/patient-context?targetUserId=` | Histórico de informações adicionais do paciente |
| GET | `/health/patient-context/latest?targetUserId=` | Última descrição registrada do paciente |
| POST | `/health/patient-context` | Registrar descrição ("como estou me sentindo agora") sem gerar relatório |
| POST | `/health/ai-overview` | Gerar relatório (`patientContext` opcional) |
| GET | `/health/ai-overview/latest` | Última geração (cache) |
| GET | `/health/ai-overview?targetUserId=&startDate=&endDate=` | Listar relatórios (`health_ai_overview`) por membro (ou família toda, sem `targetUserId`) e período; ordenado por `generatedAt` desc |
| GET | `/health/ai-overview/:id` | Buscar um relatório específico (usado no card "Relatórios de Saúde" do dashboard) |

> **Filtro por período:** usa `generatedAt` (data/hora local exibida ao usuário). `startDate`/`endDate` no formato `YYYY-MM-DD`; o service normaliza para `00:00:00`/`23:59:59`. Sem `targetUserId`, lista todos os membros aceitos da família (`getAcceptedMemberUserIds`); com `targetUserId`, valida permissão via `assertCanView`.

### Receituário
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/health/prescriptions/analyze` | Analisar foto/PDF de receita com IA (multipart `file`) |
| POST | `/health/prescriptions` | Criar receituário |
| GET | `/health/prescriptions` | Listar com filtro |
| GET | `/health/prescriptions/:id` | Detalhe |
| PUT | `/health/prescriptions/:id` | Atualizar |
| DELETE | `/health/prescriptions/:id` | Excluir |

---

## Regras de Negócio

### Permissões
- **Admin**: cria, edita e exclui exames/receituários de qualquer membro do grupo; visualiza tudo
- **Membro**: cria, edita e exclui apenas os próprios exames/receituários; pode visualizar e buscar exames de toda a família; pode visualizar o relatório IA de qualquer membro

### Processamento IA
- PDF com texto legível → `pdf-parse` v2 + **`analyzeHealthExamText`** (prompt unificado em `src/common/prompts/health-exam-extraction.prompt.ts`)
- PDF escaneado / imagem (JPEG, PNG, PDF) → **`analyzeHealthExamImage`** (mesmo prompt, via visão)
- O prompt identifica **examType** (`LABORATORY`, `IMAGING`, `FUNCTIONAL`, `PROCEDURE`, `OTHER`) e extrai campos do cadastro:
  - **LABORATORY:** analitos com `resultValue`, `referenceRange`, `itemNotes`, etc.
  - **IMAGING / FUNCTIONAL / PROCEDURE:** `findings` (laudo/descrição) + `conclusion` (impressão/conclusão)
  - **OTHER:** `findings` + `conclusion` quando aplicável
- **Padronização de `itemName` (SP-125):** o prompt exige nomes canônicos para evolução temporal:
  - **Title Case** — cada palavra com inicial maiúscula e restante minúsculo (ex.: `Ureia`, não `UREIA`)
  - Analitos de **hemograma** terminam com ` (Hemograma)` — ex.: `Hemácias (Hemograma)`
  - Analitos de **urina** terminam com ` (Urina)` — ex.: `Hemoglobina (Urina)`, `Proteinúria 24h (Urina)`
  - Remove ruído do laudo (`Hemograma - …`, `Urina Rotina - …`, `, Dosagem`, etc.), **exceto** no painel razão/relação proteína/creatinina urinária: `Proteína - Dosagem (Urina)`, `Creatinina - Dosagem (Urina)` e `Relação Proteína/Creatinina (Urina)`
  - Na **persistência** (criar / editar / aprovar), `formatLabItemDisplayName` reforça o Title Case por palavra
  - A revisão humana na aprovação continua sendo o ponto final de correção; nomes já salvos no banco **não** são migrados automaticamente
  - Sufixos `(Hemograma)` / `(Urina)` dependem da IA + revisão; o formatter de código **não** adiciona esses sufixos
- Logs estruturados no parse: `pdf_parse_start`, `pdf_parse_ok`, `pdf_parse_failed`
- Máx. 3 arquivos por execução do cron (a cada 2 min) — `HEALTH_PROCESSING_BATCH_SIZE`
- Falhas registradas com `errorMessage`, `failedAt` e `retryCount`; status `FAILED` visível na fila de pendentes
- **Retry automático:** após **2 horas** (`HEALTH_PROCESSING_AUTO_RETRY_AFTER_MS` em `health-processing.constants.ts`), o cron reenfileira e tenta de novo
- **Retry manual:** `POST /health/processing/:id/retry` — reenfileira imediatamente (somente `FAILED`); o cron processa na próxima execução
- Itens laboratoriais podem ter `itemNotes` (observação curta por analito) — migration `1775500000000-AddHealthExamItemNotes`
- Campos de retry — migration `1775600000000-AddHealthProcessingRetryFields`

### Exames
- `sourceType`: `MANUAL` = cadastro direto; `PDF`/`IMAGE_FILE` = via upload
- `status`: `PENDING_REVIEW` = em processamento; `APPROVED` = disponível para busca
- `examType`: classificado pela IA (upload) ou pelo usuário (manual)
- Exclusão faz `softDelete` e remove arquivo do Supabase Storage

### Receituário
- `daysOfWeek = null` → todos os dias
- `endDate = null` → uso contínuo (medicamento em uso)
- `scheduleTimes` → array de strings `"HH:mm"` para agendamento

---

## Arquivos-chave

### API (`api/shop-smart`)
| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/health/health.module.ts` | Módulo NestJS |
| `src/health/health.controller.ts` | Rotas HTTP |
| `src/health/health.service.ts` | Lógica de negócio, permissões |
| `src/health/health-processing.scheduler.ts` | Cron `*/2 * * * *` |
| `src/health/constants/health-processing.constants.ts` | Intervalo de retry automático (2 h), tamanho do lote e limite de arquivo |
| `src/common/prompts/` | Prompts Gemini (saúde, cupom, lista de compras, financeiro imagem/áudio) |
| `src/common/http/download-url.util.ts` | Download HTTP com timeout e limite de tamanho |
| `src/health/entities/` | 7 entidades TypeORM |
| `src/health/dto/` | DTOs de entrada/filtro/saída |
| `db/migrations/1775300000000-AddHealthTables.ts` | Migration inicial (7 tabelas) |
| `src/common/pdf/pdf-parser.util.ts` | Extração de texto PDF (v2) com logs |
| `src/common/prompts/health-exam-extraction.prompt.ts` | Prompt unificado (texto + visão) — lab ou laudo; padronização `itemName` (SP-125) |
| `src/health/utils/format-lab-item-name.ts` | Title Case de `itemName` na listagem e na persistência (SP-125) |
| `db/migrations/1775500000000-AddHealthExamItemNotes.ts` | Coluna `itemNotes` em `health_exam_item` |
| `src/health/entities/health-patient-context.entity.ts` | Entidade do histórico |
| `src/health/repositories/health-patient-context.repository.ts` | Repositório do histórico |

### App (`app/super-family-quest`)
| Arquivo | Responsabilidade |
|---------|-----------------|
| `src/pages/NewHealth/index.tsx` | Hub de tiles |
| `src/pages/NewHealth/HealthRegisterView.tsx` | Cadastro manual + upload |
| `src/pages/NewHealth/HealthPendingView.tsx` | Lista de pendentes |
| `src/pages/NewHealth/HealthPendingDetailView.tsx` | Revisão / aprovação de IA |
| `src/pages/NewHealth/HealthSearchView.tsx` | Busca de exames (lista) |
| `src/pages/NewHealth/HealthEvolutionView.tsx` | Evolução por item laboratorial |
| `src/pages/NewHealth/HealthOverviewView.tsx` | Relatório IA |
| `src/pages/NewHealth/HealthPrescriptionsView.tsx` | Lista receituários |
| `src/pages/NewHealth/HealthPrescriptionFormView.tsx` | Formulário receituário |
| `src/pages/NewHealth/HealthPrescriptionDetailView.tsx` | Detalhe receituário |
| `src/services/health.ts` | Chamadas HTTP |
| `src/hooks/useHealthExams.ts` | React Query exames + upload |
| `src/hooks/useHealthExamRegisterForm.ts` | RHF + Yup cadastro manual |
| `src/hooks/useHealthPendingReviewForm.ts` | RHF + Yup revisão de processados |
| `src/hooks/useHealthPrescriptionForm.ts` | RHF + Yup receituário |
| `src/utils/healthConstants.ts` | Tipos de exame, dias da semana, cores de status |
| `src/utils/healthUpload.ts` | Validação de upload (tipo + 10 MB) |
| `src/hooks/useHealthOverview.ts` | React Query visão geral |
| `src/hooks/useHealthPrescriptions.ts` | React Query receituário |
| `src/types/health.ts` | Tipos TypeScript |

---

## Testes

### Unitários (API)
- `HealthService.createExam` → permissão admin/membro, salvar com itens
- `HealthService.approveProcessing` → criar exame a partir de dados extraídos
- `HealthService.assertCanWrite` → membro não pode editar dados de outro
- `HealthAiProvider.parseJson` → erro em JSON inválido

### E2E (API)
```bash
npm run test:e2e:low-mem -- --testPathPattern=health
```
- POST `/health/exams` → 201 com itens
- GET `/health/exams?examName=Ureia` → 200 filtrado
- POST `/health/upload` → 201 com processamento QUEUED
- POST `/health/processing/:id/approve` → 201 com exame criado
- POST `/health/ai-overview` → 201 com relatório
- POST `/health/prescriptions` → 201 com itens
- 403 membro tentando editar exame de outro membro

### Frontend
- HealthRegisterView: preencher form + submit → mutation chamada
- HealthPendingView: lista items com status badges
- HealthOverviewView: exibe relatório em cache; "Regenerar" chama mutation
