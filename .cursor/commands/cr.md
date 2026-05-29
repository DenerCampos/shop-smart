---
description: Code Review (staged ou branches) — arquitetura, segurança, testes e docs
tags: [code-review, quality, architecture, security]
---

# Code Review - Shop Smart API

Você é revisor de código do **Shop Smart API**. Analise **apenas o diff** indicado e produza relatório acionável para o desenvolvedor revisar **antes do commit/merge**.

**Leia e aplique** (não inventar regras fora deles):
- `.cursor/rules/code-review.mdc` — checklist completo e exemplos
- `.cursor/rules/regra-projeto.mdc` — arquitetura, testes, observabilidade
- `/.cursor/rules/workflow.mdc` — git (`homolog`), docs em `.cursor/docs/`

**Branch de integração padrão:** `homolog` (não `main`). Use `main` só se `homolog` não existir no repo.

## 🔀 Modo de Operação

### Uso do Comando

#### 1. **Code Review Automático** (sem parâmetros)
```bash
cr
```
Quando executado sem parâmetros, o comando irá seguir esta ordem de prioridade:

**a) Verificar alterações em Staged:**
- Se houver arquivos em staged (`git diff --cached --name-only`)
- Fazer code review APENAS das alterações em staged (diff `--cached`)
- Analisar somente os arquivos que estão prontos para commit

**b) Se não houver staged, analisar branch atual:**
- Identificar a branch atual
- Fazer diff da branch atual com `homolog` (`git diff homolog...HEAD`)
- Analisar todas as mudanças (arquivos adicionados, modificados, removidos)
- Realizar code review completo das alterações

**Passos executados:**
1. Executar `git diff --cached --name-only` para verificar se há staged changes
2. **SE HOUVER STAGED:**
   - Executar `git diff --cached --name-only` para listar arquivos staged
   - Executar `git diff --cached` para obter as mudanças staged
   - Analisar APENAS as mudanças staged vs working directory
3. **SE NÃO HOUVER STAGED:**
   - Executar `git branch --show-current` para identificar a branch atual
   - Executar `git diff homolog...HEAD --name-only` (ou `main...HEAD` se não houver `homolog`)
   - Executar `git diff homolog...HEAD` para obter as mudanças completas
4. Analisar cada arquivo modificado seguindo o checklist de code review
5. Fornecer feedback estruturado com prioridades (🔴 Crítico, 🟡 Importante, 🟢 Sugestão)

#### 2. **Code Review entre Branches Específicas** (com parâmetros)
```bash
cr feat/SP-75 homolog
cr feat/SP-75 main
cr homolog main
```
Quando executado com parâmetros, o comando irá:
- Fazer diff entre as duas branches especificadas
- Analisar todas as mudanças entre elas
- Realizar code review completo das diferenças
- **IGNORA verificação de staged** (prioriza os parâmetros fornecidos)

**Formato:** `cr <branch-origem> <branch-destino>`

**Passos executados:**
1. Validar que ambas as branches existem
2. Executar `git diff <branch-destino>...<branch-origem> --name-only` para listar arquivos
3. Executar `git diff <branch-destino>...<branch-origem>` para obter mudanças
4. Analisar cada arquivo modificado seguindo o checklist
5. Fornecer feedback estruturado

### 🎯 Processo de Code Review Automático

**Ao receber o comando:**

1. **Identificar o Modo:**
   - Com 2 parâmetros → Comparar as branches especificadas (ignora staged)
   - Sem parâmetros → Verificar staged primeiro
     - **Se houver staged** → Analisar apenas staged changes vs main
     - **Se não houver staged** → Comparar branch atual com `homolog`

2. **Obter as Mudanças:**
   - Listar todos os arquivos alterados
   - Obter o diff completo de cada arquivo
   - Identificar linhas adicionadas (+), removidas (-), e modificadas

3. **Analisar por Categoria:**
   - Arquivos novos: Revisar estrutura completa
   - Arquivos modificados: Focar nas mudanças
   - Arquivos removidos: Validar se a remoção faz sentido

4. **Aplicar Checklist:**
   - Passar por todos os itens do checklist abaixo
   - Identificar problemas críticos, importantes e sugestões
   - Verificar aderência às regras do projeto

5. **Gerar Feedback:**
   - Organizar por prioridade (🔴 🟡 🟢)
   - Incluir arquivo, linha, problema, e solução
   - Fornecer exemplos de código correto

### 💡 Exemplos Práticos de Uso

**Exemplo 1: Tenho arquivos em staged e quero revisar antes de commitar**
```bash
# Adiciona arquivos ao staged
git add src/user/user.service.ts src/user/dto/create-user.dto.ts

# Executa code review apenas dos arquivos staged
cr

# Resultado: Analisa apenas as mudanças em staged vs main
```

**Exemplo 2: Nenhum arquivo staged, quero revisar minha branch**
```bash
# Não há nada em staged
git status  # Shows: nothing to commit

# Executa code review
cr

# Resultado: Analisa todas as mudanças da branch atual vs homolog
```

**Exemplo 3: Quero comparar duas branches específicas**
```bash
# Ignora staged e branch atual, compara branches específicas
cr feat/SP-75 develop

# Resultado: Analisa diferenças entre feat/SP-75 e develop
```

**Exemplo 4: Fluxo de trabalho recomendado**
```bash
# 1. Desenvolvo feature
# 2. Adiciono arquivos prontos ao staged
git add src/feature/feature.service.ts

# 3. Reviso apenas o que está pronto
cr  # Analisa staged

# 4. Se tudo ok, commito
git commit -m "feat: add feature service"

# 5. Continuo desenvolvendo outros arquivos
# 6. Antes de fazer PR, reviso tudo
git add .
cr  # Analisa staged

# 7. Antes de merge na homolog — revisar a branch da tarefa
cr feat/SP-75 homolog
```

### 📊 Formato de Saída

```markdown
# 🔍 Code Review Report

## 📌 Informações
- **Modo**: Staged Changes | Branch Comparison | Custom Branches
- **Branch Origem**: feat/SP-75 (ou "Staged Changes" se for staged)
- **Branch Destino**: homolog (ou informada)
- **Card Trello** (se inferível): SP-XX pelo nome da branch

## 🔒 Segurança (seção obrigatória no relatório)

Analise **cada alteração** contra esta lista. Qualquer 🔴 em segurança **bloqueia** aprovação.

### Autenticação e autorização
- [ ] Rotas protegidas com `AuthGuard` (ou guard equivalente); sem endpoint sensível público por engano
- [ ] `userId` (e `familyGroupId` quando aplicável) vêm do **JWT/sessão**, nunca só de `@Query()` / `@Body()` / `@Param()` confiados pelo cliente
- [ ] **Ownership**: update/delete/get por id validam que o recurso pertence ao usuário/grupo antes da operação
- [ ] **Multi-tenant**: queries e QueryBuilder com filtro `userId` / `familyGroupId`; soft delete com `deletedAt IS NULL` quando a entidade usa delete lógico

### Dados sensíveis e segredos
- [ ] Senhas e refresh tokens: BCrypt; `@Exclude()` em entity/DTO de resposta
- [ ] **Nada** de senha, token, API key ou PII em `logJson`, `console.log` ou mensagens de erro ao cliente
- [ ] Arquivos `.env`, chaves Gemini, Loki, Supabase, Google Drive **fora** do diff (se aparecerem no diff → 🔴 crítico)
- [ ] Respostas usam DTO de saída — não vazar campos internos, hashes ou metadados de provider

### Entrada e abuso
- [ ] DTOs com `class-validator`; `ValidationPipe` com `whitelist: true` (sem mass assignment)
- [ ] Upload (multer): limite de tamanho, tipos MIME/extensão; paths de storage sem traversal (`../`)
- [ ] **Throttler** em rotas caras ou públicas (IA, auth, upload) quando fizer sentido
- [ ] Sem `repository.query()` com concatenação de string; parâmetros sempre bound

### Domínios de risco do projeto
- [ ] **IA (Gemini)**: prompts não expõem dados de outro usuário; quota/erro tratados; telemetria sem conteúdo sensível do usuário
- [ ] **Coupon reader / scraping**: URLs controladas; sem SSRF (não buscar URL arbitrária do cliente sem allowlist)
- [ ] **WebSocket** (shopping-list): autenticação na conexão; sala/evento isolado por usuário ou família
- [ ] **OAuth / Alexa / Google Drive**: tokens armazenados e revogados com segurança; scopes mínimos
- [ ] **Arquivos** (`file-storage`, `supabase-storage`): URLs assinadas/expiração; bucket/path não adivinhável entre tenants

### Erros e observabilidade
- [ ] `AllExceptionsFilter`: respostas sem stack trace em produção; sem vazar SQL ou detalhes internos
- [ ] Eventos `logJson` com `event` estável; sem payload com credenciais

Registrar achados em **## 🔒 Segurança** no relatório (🔴/🟡/🟢 + arquivo + linha + correção).

## 📄 Documentação e entrega (workflow)

- [ ] Feature nova ou regra alterada: existe/atualiza `.cursor/docs/<feature>.md`?
- [ ] Índice em `regra-projeto.mdc` (Docs de domínio) atualizado?
- [ ] **Testes unitários** para lógica nova/alterada em `*.spec.ts`
- [ ] **E2E** em `test/**/*.e2e-spec.ts` para rota HTTP nova ou contrato alterado; rodar com `npm run test:e2e:low-mem -- --testPathPattern=<spec>` (pouca RAM, um arquivo por vez)
- **Arquivos Analisados**: 12
- **Arquivos Modificados**: 8
- **Arquivos Novos**: 3
- **Arquivos Removidos**: 1

## 🔴 PROBLEMAS CRÍTICOS (X encontrados)
[Lista de problemas críticos com arquivo, linha, problema, e solução]

## 🟡 MELHORIAS IMPORTANTES (X encontradas)
[Lista de melhorias importantes]

## 🟢 SUGESTÕES (X sugestões)
[Lista de sugestões opcionais]

## ✅ PONTOS POSITIVOS
[Destacar boas práticas encontradas]

## 📊 RESUMO
- Total de Issues: X
- Críticos: X (devem ser corrigidos)
- Importantes: X (devem ser melhorados)
- Sugestões: X (opcional)
```

## 📋 Checklist de Code Review

### 1. Arquitetura e Estrutura

#### ✅ Separação de Camadas
- [ ] **Controller**: Apenas recebe requisições, valida DTOs e chama services
- [ ] **Service**: Contém TODA a lógica de negócio
- [ ] **Repository**: Apenas acesso a dados, sem lógica de negócio
- [ ] **Entity**: Apenas estrutura de dados e relacionamentos
- [ ] **DTO**: Validação e transformação de dados

#### ✅ Responsabilidades
- [ ] Cada classe tem uma única responsabilidade (SRP)
- [ ] Não há lógica de negócio nos controllers
- [ ] Não há lógica de negócio nos repositories
- [ ] Services orquestram a lógica corretamente

### 2. TypeScript e Tipagem

#### ✅ Qualidade do Código TypeScript
- [ ] **Tipagem forte**: Evitar `any`, usar tipos específicos
- [ ] **Interfaces/Types**: Definidos para estruturas complexas
- [ ] **Enums**: Usados para valores fixos
- [ ] **Generics**: Usados quando apropriado
- [ ] **Null safety**: Verificar valores nulos/undefined
- [ ] **Type guards**: Usar when necessário

### 3. NestJS - Framework

#### ✅ Decorators e Injeção de Dependências
- [ ] **@Injectable()**: Em todos os services e providers
- [ ] **Constructor injection**: Para todas as dependências
- [ ] **@Module()**: Configurado corretamente (imports, providers, exports)
- [ ] **Guards**: Aplicados corretamente (@UseGuards(AuthGuard))
- [ ] **Pipes**: ValidationPipe usado quando necessário
- [ ] **Interceptors**: Aplicados quando necessário

#### ✅ Controllers
- [ ] **@Controller()**: Com prefixo correto
- [ ] **HTTP Methods**: @Get(), @Post(), @Put(), @Patch(), @Delete()
- [ ] **@Body()**, **@Param()**, **@Query()**: Usados corretamente
- [ ] **Status codes**: Apropriados para cada operação
- [ ] **Sem Swagger** no projeto (não exigir `@Api*` — ver `regra-projeto.mdc`)

### 4. TypeORM - Banco de Dados

#### ✅ Entities
- [ ] **@Entity()**: Decorador presente
- [ ] **@PrimaryGeneratedColumn()**: Para chaves primárias
- [ ] **@Column()**: Com tipos apropriados
- [ ] **@CreateDateColumn()**, **@UpdateDateColumn()**: Para timestamps
- [ ] **Relacionamentos**: @ManyToOne, @OneToMany, @ManyToMany configurados
- [ ] **Cascade options**: Configuradas com cuidado
- [ ] **Índices**: @Index() em campos de busca

#### ✅ Repositories
- [ ] **Extends Repository**: Ou usa @InjectRepository
- [ ] **QueryBuilder**: Usado corretamente
- [ ] **Select específico**: Evitar SELECT *
- [ ] **Joins**: Otimizados (lazy vs eager loading)
- [ ] **Transações**: Usadas quando necessário
- [ ] **Paginação**: Implementada em listagens

### 5. DTOs e Validação

#### ✅ Estrutura de DTOs
- [ ] **Separação**: DTOs de request vs response
- [ ] **class-validator**: Decorators aplicados
  - @IsString(), @IsNumber(), @IsEmail(), etc.
  - @IsOptional(), @IsNotEmpty()
  - @Min(), @Max(), @Length()
  - @IsEnum() para enums
- [ ] **class-transformer**: @Exclude(), @Expose(), @Transform()
- [ ] **Sem** `@ApiProperty` (projeto sem OpenAPI ativo)
- [ ] **Nomenclatura**: CreateXDto, UpdateXDto, FilterXDto, ResponseXDto

### 6. Clean Code

#### ✅ Nomenclatura
- [ ] **Classes**: PascalCase (UserService, ExpenseController)
- [ ] **Métodos/Funções**: camelCase (findAll, createExpense)
- [ ] **Variáveis**: camelCase, descritivas (userId, expenseList)
- [ ] **Constantes**: UPPER_SNAKE_CASE
- [ ] **Interfaces**: PascalCase, começar com I (IUserRepository)
- [ ] **Nomes descritivos**: Clareza sobre o propósito

#### ✅ Funções e Métodos
- [ ] **Tamanho**: Funções pequenas (< 50 linhas idealmente)
- [ ] **Single Responsibility**: Cada função faz UMA coisa
- [ ] **Parâmetros**: Máximo 3-4 parâmetros (usar objetos se precisar mais)
- [ ] **Return early**: Evitar nested ifs profundos
- [ ] **Async/await**: Preferir sobre callbacks
- [ ] **Error handling**: Try/catch apropriados

#### ✅ Organização
- [ ] **Imports**: Organizados (built-in, externos, internos)
- [ ] **Ordem**: Constantes → Interfaces → Classes → Exports
- [ ] **Separação**: Lógica separada em métodos privados quando apropriado
- [ ] **Comentários**: Apenas quando necessário (código deve ser autoexplicativo)

### 7. Segurança

Usar a seção **🔒 Segurança (obrigatória no relatório)** acima + detalhes em `.cursor/rules/code-review.mdc` (🛡️ Segurança, Red Flags).

### 8. Performance

#### ✅ Banco de Dados
- [ ] **Paginação**: Implementada em TODAS as listagens
- [ ] **Select específico**: Não usar SELECT *
- [ ] **Índices**: Em campos de busca e foreign keys
- [ ] **N+1 queries**: Evitadas (usar eager loading apropriado)
- [ ] **Transações**: Para operações múltiplas
- [ ] **Connection pool**: Configurado apropriadamente

#### ✅ Código
- [ ] **Loops**: Evitar loops desnecessários
- [ ] **Cache**: Considerar Redis para dados frequentes
- [ ] **Lazy loading**: Quando apropriado
- [ ] **Async operations**: Não bloquear o event loop

### 9. Tratamento de Erros

#### ✅ Exceções
- [ ] **Exceções customizadas**: Usar exceptions da pasta exception/
  - AlreadyExistsException
  - NotExistException
  - InsufficientResourceException
  - RemoveException
  - UpdateException
- [ ] **HTTP exceptions**: Usar quando apropriado
  - BadRequestException (400)
  - UnauthorizedException (401)
  - ForbiddenException (403)
  - NotFoundException (404)
  - ConflictException (409)
  - InternalServerErrorException (500)
- [ ] **Mensagens claras**: Erros com mensagens descritivas
- [ ] **Não expor detalhes internos**: Mensagens seguras para o cliente
- [ ] **Logs**: Erros logados apropriadamente

### 10. Testes

#### ✅ Cobertura de Testes
- [ ] **Unit tests**: Para lógica de negócio crítica
- [ ] **Mocks**: Usando @nestjs/testing
- [ ] **Test cases**: Casos felizes e de erro
- [ ] **Nomenclatura**: describe(), it() descritivos
- [ ] **Arrange-Act-Assert**: Padrão seguido

### 11. Documentação

#### ✅ `.cursor/docs/` (obrigatório no workflow)
- [ ] Doc de domínio criada/atualizada para feature ou mudança de regra
- [ ] `regra-projeto.mdc` lista o arquivo em Docs de domínio

#### ✅ Comentários
- [ ] **JSDoc**: Para métodos públicos complexos
- [ ] **Comentários inline**: Apenas para lógica complexa
- [ ] **TODO/FIXME**: Removidos ou documentados
- [ ] **README**: Atualizado se necessário

### 12. Git e Versionamento

#### ✅ Commits
- [ ] **Mensagens semânticas**: feat, fix, refactor, docs, test, chore
- [ ] **Mensagens descritivas**: Claro o que foi mudado
- [ ] **Tamanho**: Commits atômicos (uma mudança lógica por commit)
- [ ] **.env**: Nunca commitado

### 13. Padrões Específicos do Projeto

#### ✅ Event Emitter
- [ ] **Eventos**: Usados para desacoplamento
- [ ] **Nomenclatura**: {dominio}.{acao} (user.created)
- [ ] **Listeners**: Implementados corretamente
- [ ] **Async**: Eventos assíncronos quando apropriado

#### ✅ Paginação
- [ ] **Common/pagination**: Usar sistema de paginação do projeto
- [ ] **Metadata**: Incluída nas respostas
- [ ] **Defaults**: Página 1, limit 10

#### ✅ Response Padronizada
- [ ] **Common/response**: Usar helpers de resposta
- [ ] **Formato consistente**: Estrutura padronizada
- [ ] **Status codes**: Apropriados

### 14. Migrations

#### ✅ Banco de Dados
- [ ] **Sempre migrations**: NUNCA alterar banco manualmente
- [ ] **synchronize: false**: Em produção
- [ ] **Reversível**: Migration deve ter up e down
- [ ] **Testada**: Em ambiente de desenvolvimento
- [ ] **Documentada**: Comentários sobre mudanças

## 🎯 Como Realizar o Code Review

### Passo 1: Análise Geral
1. Entenda o propósito das mudanças
2. Verifique se segue a arquitetura do projeto
3. Identifique o módulo/camada sendo modificado

### Passo 2: Checklist Detalhado
1. Passe por cada item do checklist acima
2. Marque os itens que estão corretos
3. Anote os itens que precisam de correção

### Passo 3: Análise de Código
1. **Leia o código linha por linha**
2. **Questione decisões**: "Por que foi feito assim?"
3. **Pense em edge cases**: "E se X acontecer?"
4. **Considere manutenibilidade**: "É fácil de entender e modificar?"

### Passo 4: Feedback
1. **Seja específico**: Aponte exatamente o que precisa mudar
2. **Seja construtivo**: Explique o porquê e sugira alternativas
3. **Priorize**: Separe problemas críticos de sugestões
4. **Eduque**: Explique conceitos quando necessário

## 📝 Formato de Feedback

### Estrutura do Feedback

```markdown
## 🔴 CRÍTICO (deve ser corrigido)
- **Arquivo**: `src/user/user.service.ts`
- **Linha**: 45
- **Problema**: Senha sendo retornada na resposta
- **Correção**: Adicionar @Exclude() no campo password da entity
- **Motivo**: Segurança - senhas nunca devem ser expostas

## 🟡 IMPORTANTE (deve ser melhorado)
- **Arquivo**: `src/expense/expense.service.ts`
- **Linha**: 78-95
- **Problema**: Função muito longa (120 linhas)
- **Sugestão**: Quebrar em métodos menores (calculateTotal, validateExpense)
- **Motivo**: Clean Code - funções devem fazer uma coisa

## 🟢 SUGESTÃO (opcional mas recomendado)
- **Arquivo**: `src/revenue/revenue.controller.ts`
- **Linha**: 25
- **Sugestão**: Adicionar @ApiResponse() para documentar possíveis erros
- **Benefício**: Melhor documentação da API
```

## 🚀 Exemplos de Problemas Comuns

### ❌ Problema 1: Lógica de Negócio no Controller
```typescript
// ERRADO
@Post()
async create(@Body() dto: CreateExpenseDto) {
  // Lógica de negócio no controller
  if (dto.value <= 0) {
    throw new BadRequestException('Valor deve ser positivo');
  }
  const expense = await this.expenseService.create(dto);
  return expense;
}

// CORRETO
@Post()
async create(@Body() dto: CreateExpenseDto) {
  // Controller apenas delega para o service
  return this.expenseService.create(dto);
}
```

### ❌ Problema 2: Falta de Paginação
```typescript
// ERRADO
async findAll(): Promise<Expense[]> {
  return this.expenseRepository.find(); // Pode retornar milhares de registros
}

// CORRETO
async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResult<Expense>> {
  return this.paginationService.paginate(this.expenseRepository, page, limit);
}
```

### ❌ Problema 3: Senha Exposta
```typescript
// ERRADO
@Entity()
export class User {
  @Column()
  password: string; // Será exposta nas respostas
}

// CORRETO
@Entity()
export class User {
  @Column()
  @Exclude() // Não será exposta nas respostas
  password: string;
}
```

### ❌ Problema 4: SQL Injection Risk (uso incorreto de query)
```typescript
// ERRADO
async findByName(name: string) {
  return this.repository.query(`SELECT * FROM users WHERE name = '${name}'`);
}

// CORRETO
async findByName(name: string) {
  return this.repository.findOne({ where: { name } });
}
```

### ❌ Problema 5: Falta de Validação
```typescript
// ERRADO
export class CreateExpenseDto {
  value: number;
  description: string;
}

// CORRETO
export class CreateExpenseDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  value: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(3, 200)
  description: string;
}
```

## 🎓 Recursos e Referências

- **NestJS Docs**: https://docs.nestjs.com/
- **TypeORM Docs**: https://typeorm.io/
- **Clean Code**: Princípios de código limpo
- **SOLID Principles**: Princípios de design orientado a objetos
- **Regras**: `.cursor/rules/regra-projeto.mdc`
- **Code Review**: `.cursor/rules/code-review.mdc`
- **Workflow**: `/.cursor/rules/workflow.mdc`

## 📌 Lembre-se

- Code review é sobre **melhorar o código**, não criticar o desenvolvedor
- Seja **respeitoso** e **construtivo**
- **Aprenda** com o código dos outros
- **Compartilhe conhecimento**
- Foque em **qualidade**, **manutenibilidade** e **segurança**

---

**Instruções de Uso**:
1. Cole o código que deseja revisar
2. Especifique o contexto (módulo, feature, propósito)
3. Aguarde análise detalhada baseada neste checklist
4. Receba feedback estruturado com prioridades
5. Implemente correções sugeridas
