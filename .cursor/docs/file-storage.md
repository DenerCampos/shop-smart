# Armazenamento de arquivos (File Storage)

Abstração de upload, delete e resolução de URLs para imagens da API (foto de perfil, fotos de receitas, fotos de tarefas). O provider ativo é escolhido por variável de ambiente; o código de domínio depende apenas do token Nest `FILE_STORAGE`.

---

## Visão geral

| Provider | Variável | Uso |
|----------|----------|-----|
| **Supabase Storage** (padrão) | `FILE_STORAGE_PROVIDER=supabase` | Novos deploys; bucket `SUPABASE_STORAGE_BUCKET` |
| **Google Drive** (legado) | `FILE_STORAGE_PROVIDER=google-drive` | Ambientes que ainda usam OAuth + pasta no Drive |

Módulos consumidores:

- `ProfileService` — `profile/`
- `RecipeService` — `recipe/`
- `ChoreService` — `chore/`

Todos injetam `@Inject(FILE_STORAGE) private readonly fileStorage: IFileStorageService`.

---

## Arquitetura

```
ProfileModule / RecipeModule / ChoreModule
        │
        ▼
  FileStorageModule  ──►  FILE_STORAGE (token)
        │
        ▼
  LegacyAwareFileStorageService
        │
        ├── provider ativo (lazy, 1º uso)
        │     ├── supabase  → SupabaseStorageService
        │     └── google-drive → GoogleDriveService
        │
        └── Google Drive (lazy, só cleanup legado quando provider = supabase)
```

### Arquivos principais

| Caminho | Responsabilidade |
|---------|------------------|
| `src/file-storage/file-storage.module.ts` | Registra o token `FILE_STORAGE` |
| `src/file-storage/legacy-aware-file-storage.service.ts` | Facade: provider ativo + fallback Drive |
| `src/file-storage/interfaces/file-storage.interface.ts` | Contrato `IFileStorageService` |
| `src/file-storage/file-storage.constants.ts` | Token `FILE_STORAGE` |
| `src/file-storage/utils/file-storage-url.util.ts` | Parsing de URLs Supabase e Drive |
| `src/supabase-storage/supabase-storage.service.ts` | Implementação Supabase |
| `src/google-drive/google-drive.service.ts` | Implementação Google Drive |
| `src/common/app-config/app.config.ts` | `getFileStorageProvider()`, `getSupabaseStorage()`, `normalizeSupabaseUrl()` |

### Contrato `IFileStorageService`

```typescript
uploadFile(buffer, fileName, mimeType, subfolder?) → FileStorageUploadResult
deleteFile(fileIdOrPath) → void
extractFileIdFromUrl(url) → string | null
```

- **`subfolder`**: pasta lógica no storage (`profile`, `recipe`, `chore`).
- **`webContentLink`**: URL persistida no banco (perfil, receitas, tarefas).
- **`fileId`**: no Supabase é o **path** (`profile/uuid.png`); no Drive é o **file id** do Google.

---

## Variáveis de ambiente

Referência completa em [`.env-default`](../../.env-default).

```env
# supabase | google-drive (qualquer outro valor cai em supabase)
FILE_STORAGE_PROVIDER=supabase

# Supabase (quando FILE_STORAGE_PROVIDER=supabase)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=sb_secret_...
SUPABASE_STORAGE_BUCKET=shop-smart

# Google Drive (quando FILE_STORAGE_PROVIDER=google-drive)
GOOGLE_DRIVE_CLIENT_ID=
GOOGLE_DRIVE_CLIENT_SECRET=
GOOGLE_DRIVE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=
GOOGLE_DRIVE_RATE_LIMIT=50
```

### Supabase Storage

1. **URL**: Project Settings → Data API → Project URL. Sem `/rest/v1` e sem barra final (`AppConfig.normalizeSupabaseUrl()` corrige isso se vier errado).
2. **KEY**: Secret key (`sb_secret_...`) — usada no servidor para upload/delete.
3. **Bucket**: deve existir no Supabase Storage e ter **leitura pública** (policy `SELECT` para `anon` ou `authenticated`), pois a API usa `getPublicUrl()` para montar links exibidos no app.
4. Upload/delete no servidor usam a secret key; o cliente só consome URLs públicas.

### Google Drive

Configuração OAuth e renovação de refresh token: [google-drive-token-config.md](./google-drive-token-config.md).

---

## Comportamento por operação

### Upload

Sempre pelo **provider ativo**. Nomes de arquivo incluem UUID para evitar colisão. Subpastas:

| Domínio | Subfolder | Exemplo de path/id |
|---------|-----------|-------------------|
| Perfil | `profile` | `profile/profile_<userId>_<uuid>.png` |
| Receita | `recipe` | `recipe/recipe-<uuid>.jpg` |
| Tarefa | `chore` | `chore/chore_<occurrenceId>_<kind>_<uuid>.jpg` |

No Supabase, upload usa `upsert: true` (sobrescreve se o mesmo path existir).

### Delete

1. Serviço extrai identificador da URL antiga com `extractFileIdFromUrl`.
2. Chama `deleteFile(identificador)`.
3. Falhas de delete são logadas como `warn` (não bloqueiam fluxo principal).

### Migração Drive → Supabase (URLs legadas)

Usuários podem ainda ter `profileImage` ou fotos de receita apontando para URLs do Google Drive. Com `FILE_STORAGE_PROVIDER=supabase`:

- **`extractFileIdFromUrl`**: tenta formato Supabase; se falhar, faz fallback para URLs `lh3.googleusercontent.com/d/...` ou `drive.google.com/...&id=...`.
- **`deleteFile`**: se o identificador **não contém `/`** e parece file id do Drive, o delete vai para o **Google Drive lazy** (credenciais `GOOGLE_DRIVE_*` ainda necessárias para limpar arquivos antigos).

O Google Drive **não** é inicializado no bootstrap quando o provider é Supabase — só na primeira operação de cleanup legado.

---

## Inicialização lazy

`LegacyAwareFileStorageService` instancia apenas o provider configurado no **primeiro** upload/delete/extract. Isso evita:

- Criar cliente OAuth do Drive quando só Supabase é usado.
- Criar cliente Supabase quando só Drive é usado.

Exceção: cleanup de arquivo legado no Drive (provider Supabase) instancia `GoogleDriveService` sob demanda.

---

## Testes

### Unitários

| Spec | O que cobre |
|------|-------------|
| `src/file-storage/test/legacy-aware-file-storage.service.spec.ts` | Facade, fallback Drive, lazy providers |
| `src/file-storage/test/file-storage-url.util.spec.ts` | Parsing de URLs |
| `src/supabase-storage/test/supabase-storage.service.spec.ts` | Upload, delete, config incompleta |
| `src/google-drive/test/google-drive.service.spec.ts` | Drive (comportamento existente) |
| `src/profile/test/profile.service.spec.ts` | Integração com `FILE_STORAGE` |
| `src/recipe/test/recipe.service.spec.ts` | Idem |
| `src/chore/test/chore.service.spec.ts` | Idem |

Mock de config Supabase: `src/common/test/supabase-storage-app-config.mock.ts`.

Comando:

```bash
npm test -- --testPathPattern="file-storage|supabase-storage|google-drive|profile.service|recipe.service|chore.service"
```

### E2E

A app E2E mocka o token **`FILE_STORAGE`**, não `GoogleDriveService` diretamente:

- `test/e2e/helpers/external-mocks.ts` → `mockFileStorageService()`
- `test/e2e/helpers/create-e2e-app.ts` → `.overrideProvider(FILE_STORAGE)`

Assim, `FILE_STORAGE_PROVIDER=supabase` no `.env.test.example` funciona sem credenciais Supabase reais. Ver também [testes.md](./testes.md).

---

## Adicionar novo uso de storage

1. Importar `FileStorageModule` no módulo do domínio.
2. Injetar `@Inject(FILE_STORAGE) fileStorage: IFileStorageService`.
3. Escolher um `subfolder` estável (ex.: `mission/`).
4. Persistir `uploadResult.webContentLink` (ou o campo que o DTO expõe).
5. Ao remover/trocar imagem: `extractFileIdFromUrl` + `deleteFile`.
6. Adicionar testes unitários mockando `FILE_STORAGE`.

Não injetar `GoogleDriveService` ou `SupabaseStorageService` diretamente nos services de domínio.

---

## Troubleshooting

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `Configuração do Supabase Storage incompleta` | `SUPABASE_URL` / `SUPABASE_KEY` / bucket vazio | Preencher `.env` |
| Upload OK, imagem não carrega no app | Bucket privado | Policy pública de leitura no bucket |
| Foto antiga do Drive não some ao trocar perfil | URL legada + Drive sem credenciais | Manter `GOOGLE_DRIVE_*` válidas até migrar URLs no banco |
| `invalid_grant` no Drive | Refresh token expirado | [google-drive-token-config.md](./google-drive-token-config.md) |
| E2E falha em upload de imagem | Mock desatualizado | Confirmar override de `FILE_STORAGE` em `create-e2e-app.ts` |

---

## Referências

- [google-drive-token-config.md](./google-drive-token-config.md) — OAuth e refresh token do Drive
- [testes.md](./testes.md) — estratégia Jest e E2E
- [`.env-default`](../../.env-default) — template de variáveis
- [`.env.test.example`](../../.env.test.example) — ambiente de teste (E2E mocka `FILE_STORAGE`)
