# OAuth2 — Account Linking para Assistentes de Voz

## Visão Geral

A API implementa um servidor OAuth2 com o fluxo **Authorization Code Grant**, permitindo que assistentes de voz (Alexa, Google Assistant, Siri etc.) se autentiquem como um usuário real da plataforma.

A arquitetura é **multi-cliente**: cada assistente de voz é um `OauthClient` cadastrado no banco de dados. Para integrar um novo assistente, basta inserir um registro na tabela `oauth_client` — sem nenhuma mudança de código.

---

## Fluxo Completo

```
[Assistente] → GET /auth/oauth/authorize?client_id=...&response_type=code&scope=...&redirect_uri=...&state=...
[Backend]    → valida client_id e redirect_uri no banco → gera session_code (10min) → 302 para FRONTEND_URL/alexa-login?session_code=SC
[Frontend]   → exibe tela de login
[Usuário]    → digita email + senha
[Frontend]   → POST /auth/oauth/login {email, password, session_code}
[Backend]    → autentica, cria auth_code (5min) → retorna {redirectUrl: "redirect_uri?code=CODE&state=STATE"}
[Frontend]   → redireciona para redirectUrl
[Assistente] → POST /auth/oauth/token {grant_type=authorization_code, code, client_id, client_secret, redirect_uri}
[Backend]    → valida tudo → retorna {access_token, token_type, expires_in: 3600, refresh_token}

[Renovação]
[Assistente] → POST /auth/oauth/token {grant_type=refresh_token, refresh_token, client_id, client_secret}
[Backend]    → valida → retorna novo {access_token, expires_in: 3600, refresh_token}
```

---

## Endpoints da API

### `GET /auth/oauth/authorize`

Iniciado pelo assistente de voz. O backend valida e redireciona para a tela de login do frontend.

**Query params:**

| Parâmetro      | Tipo   | Obrigatório | Descrição                                |
|----------------|--------|-------------|------------------------------------------|
| `client_id`    | string | sim         | ID do cliente OAuth cadastrado no banco  |
| `response_type`| string | sim         | Deve ser `code`                          |
| `scope`        | string | sim         | Escopos solicitados (ex: `profile`)      |
| `redirect_uri` | string | sim         | URL de callback (deve estar na whitelist)|
| `state`        | string | não         | Valor opaco para prevenir CSRF           |

**Resposta:** `302` para `FRONTEND_URL/alexa-login?session_code=<uuid>`

O `session_code` expira em **10 minutos** e é armazenado apenas em memória.

---

### `POST /auth/oauth/login`

Chamado pelo **frontend** após o usuário preencher suas credenciais na tela de login OAuth.

**Body:**

```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "session_code": "uuid-gerado-pelo-authorize"
}
```

**Resposta `200`:**

```json
{
  "redirectUrl": "https://layla.amazon.com/api/skill/link/XXXXX?code=uuid-do-code&state=valor-original"
}
```

O frontend deve redirecionar o browser para `redirectUrl`. O `auth_code` dentro da URL expira em **5 minutos**.

---

### `POST /auth/oauth/token`

Chamado pelo assistente de voz para trocar o `code` por tokens, ou para renovar o `access_token`.

**Headers:** `Content-Type: application/x-www-form-urlencoded` (Alexa) ou `application/json`

#### Grant type: `authorization_code`

```
grant_type=authorization_code&code=uuid-do-code&client_id=alexa-skill-prod&client_secret=secret-em-texto-puro&redirect_uri=https://layla.amazon.com/api/skill/link/XXXXX
```

#### Grant type: `refresh_token`

```
grant_type=refresh_token&refresh_token=uuid-do-refresh-token&client_id=alexa-skill-prod&client_secret=secret-em-texto-puro
```

**Resposta `200` (ambos os grant types):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "uuid-refresh-token"
}
```

O `access_token` é o JWT padrão da plataforma com payload:
```json
{
  "sub": "user-uuid",
  "username": "usuario@email.com",
  "familyGroupId": "family-group-uuid-ou-null"
}
```

---

## Endpoints para Assistentes de Voz

### `POST /alexa/intent`

Recebe comandos de voz da Alexa Lambda e retorna a resposta no formato Alexa.

**Headers:** `Authorization: Bearer <access_token>`

**Body (formato real enviado pela Alexa Lambda):**

```json
{
  "version": "1.0",
  "session": {
    "new": true,
    "sessionId": "amzn1.echo-api.session.xxx",
    "application": { "applicationId": "amzn1.ask.skill.SEU-SKILL-ID" },
    "user": {
      "userId": "amzn1.ask.account.xxx",
      "accessToken": "JWT-DO-USUARIO"
    }
  },
  "context": {
    "System": {
      "application": { "applicationId": "amzn1.ask.skill.SEU-SKILL-ID" },
      "user": {
        "userId": "amzn1.ask.account.xxx",
        "accessToken": "JWT-DO-USUARIO"
      },
      "device": { "deviceId": "xxx", "supportedInterfaces": {} }
    }
  },
  "request": {
    "type": "IntentRequest",
    "requestId": "amzn1.echo-api.request.xxx",
    "timestamp": "2026-04-10T12:00:00Z",
    "locale": "pt-BR",
    "intent": {
      "name": "AddItemIntent",
      "confirmationStatus": "NONE",
      "slots": {
        "item": { "name": "item", "value": "arroz", "confirmationStatus": "NONE" },
        "quantidade": { "name": "quantidade", "value": "1", "confirmationStatus": "NONE" },
        "lista": { "name": "lista", "value": "mercado", "confirmationStatus": "NONE" }
      }
    }
  }
}
```

> **Como o `accessToken` chega:** após o Account Linking, a Alexa armazena o JWT nos servidores da Amazon e o injeta automaticamente em `session.user.accessToken` e `context.System.user.accessToken` a cada comando de voz. O backend lê esse token do body — não do header `Authorization`. Quando o JWT expira (1 hora), a Alexa renova automaticamente via `refresh_token` sem intervenção do usuário.

**Intents suportados:**

| Intent             | Slots                          | Ação                                                    |
|--------------------|--------------------------------|---------------------------------------------------------|
| `AddItemIntent`    | `item`, `quantidade?`, `lista?`| Adiciona item na lista informada ou na lista ativa      |
| `RemoveItemIntent` | `item`, `lista?`               | Remove item por nome da lista informada ou da lista ativa |
| `ListItemsIntent`  | —                              | Lê os itens pendentes da lista ativa                    |

**Lógica do slot `lista` (para `AddItemIntent` e `RemoveItemIntent`):**

| Situação | Comportamento |
|---|---|
| `lista` informada e encontrada | Opera na lista específica |
| `lista` informada mas não encontrada | Responde com os nomes das listas disponíveis |
| `lista` vazia + 1 lista ativa | Opera automaticamente na única lista |
| `lista` vazia + várias listas | Pergunta em qual lista operar, listando as opções por nome |
| Nenhuma lista ativa (apenas `AddItemIntent`) | Cria uma nova lista e adiciona o item |

**Exemplos de resposta de voz:**

```
AddItemIntent (lista única):    "arroz adicionado na lista Mercado."
AddItemIntent (várias listas):  "Você tem 2 listas: Mercado, Feira. Em qual delas devo adicionar arroz?"
AddItemIntent (lista por nome): "Adicionado! 1 arroz na lista Mercado."
RemoveItemIntent:               "arroz removido da lista Mercado."
ListItemsIntent:                "Sua lista tem: 1 arroz, leite e feijão."
```

**Resposta `200` (formato Alexa):**

```json
{
  "version": "1.0",
  "response": {
    "outputSpeech": {
      "type": "PlainText",
      "text": "Adicionado! 1 arroz na lista Mercado."
    },
    "shouldEndSession": true
  }
}
```

**Rota de teste (sem autenticação):**

`POST /alexa/intent/test` — retorna uma resposta estática para validar conectividade. Remover após testes.

### `POST /shopping-lists/alexa/add-item`

Endpoint legado — adiciona um item à lista de compras ativa. Use `/alexa/intent` com `AddItemIntent` para novas integrações.

**Headers:** `Authorization: Bearer <access_token>`

**Body:**

```json
{
  "text": "2 quilos de arroz"
}
```

---

## Endpoints de Integração (Frontend)

### `GET /profile/integrations`

Retorna o status de todas as integrações do usuário autenticado.

**Headers:** `Authorization: Bearer <jwt>`

**Resposta `200`:**

```json
{
  "alexa": {
    "connected": true,
    "linkedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### `POST /profile/integrations/alexa/unlink`

Remove o vínculo da Alexa para o usuário autenticado.

**Headers:** `Authorization: Bearer <jwt>`

**Resposta `200`:**

```json
{
  "unlinked": true
}
```

Retorna `{ "unlinked": false }` se o usuário não tinha a Alexa vinculada.

---

## Banco de Dados

### Tabela `oauth_client`

| Coluna         | Tipo         | Descrição                                              |
|----------------|--------------|--------------------------------------------------------|
| `id`           | VARCHAR(36)  | PK UUID gerado automaticamente                         |
| `clientId`     | VARCHAR(100) | Identificador único de negócio (ex: `alexa-skill-prod`)|
| `slug`         | VARCHAR(50)  | Chave curta para uso no JSON (ex: `alexa`)             |
| `name`         | VARCHAR(150) | Nome legível (ex: "Alexa Skill")                       |
| `clientSecret` | VARCHAR(255) | Hash bcrypt do secret real                             |
| `redirectUris` | TEXT (JSON)  | Array de URIs permitidas                               |
| `createdAt`    | DATETIME     |                                                        |
| `updatedAt`    | DATETIME     |                                                        |

### Tabela `oauth_code`

| Coluna       | Tipo         | Descrição                              |
|--------------|--------------|----------------------------------------|
| `id`         | VARCHAR(36)  | PK UUID                                |
| `code`       | VARCHAR(100) | Código temporário único                |
| `redirectUri`| VARCHAR(500) | URI usada na requisição original       |
| `expiresAt`  | DATETIME     | Expiração (5 minutos após criação)     |
| `createdAt`  | DATETIME     |                                        |
| `userId`     | VARCHAR(36)  | FK → `user.id`                         |
| `clientId`   | VARCHAR(36)  | FK → `oauth_client.id`                 |

### Tabela `oauth_connection`

Registra de forma persistente o vínculo entre um usuário e um cliente OAuth. Criada/atualizada quando a Alexa (ou outro assistente) troca o `code` por tokens com sucesso.

| Coluna      | Tipo        | Descrição                                    |
|-------------|-------------|----------------------------------------------|
| `id`        | VARCHAR(36) | PK UUID                                      |
| `linkedAt`  | DATETIME    | Data de criação do vínculo                   |
| `updatedAt` | DATETIME    | Data da última renovação de token            |
| `userId`    | VARCHAR(36) | FK → `user.id`                               |
| `clientId`  | VARCHAR(36) | FK → `oauth_client.id`                       |

---

## Cadastrando um Novo Cliente OAuth

### 1. Gerar o hash do secret

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('seu-secret-aqui', 10).then(console.log)"
```

### 2. Inserir no banco

```sql
-- Alexa
INSERT INTO oauth_client (id, clientId, slug, name, clientSecret, redirectUris, createdAt, updatedAt)
VALUES (
  UUID(),
  'alexa-skill-prod',
  'alexa',
  'Alexa Skill',
  '$2b$10$hash_gerado_acima',
  '["https://layla.amazon.com/api/skill/link/SEU_SKILL_ID","https://pitangui.amazon.com/api/skill/link/SEU_SKILL_ID","https://alexa.amazon.co.jp/api/skill/link/SEU_SKILL_ID"]',
  NOW(),
  NOW()
);

-- Google Assistant (futuro)
INSERT INTO oauth_client (id, clientId, slug, name, clientSecret, redirectUris, createdAt, updatedAt)
VALUES (
  UUID(),
  'google-assistant-prod',
  'google',
  'Google Assistant',
  '$2b$10$hash_google',
  '["https://oauth-redirect.googleusercontent.com/r/SEU_PROJECT_ID"]',
  NOW(),
  NOW()
);
```

### 3. Variáveis de ambiente (para validação por env)

```env
ALEXA_SKILL_CLIENT_ID=alexa-skill-prod
ALEXA_SKILL_CLIENT_SECRET=seu-secret-aqui
```

> O `clientSecret` enviado pela Alexa é comparado via `bcrypt.compare` com o hash armazenado no banco.

---

## Implementação no Frontend

### Página de Login OAuth (`/alexa-login`)

O frontend precisa de uma rota dedicada para capturar o `session_code` e exibir um formulário de login.

#### Exemplo com React + Axios

```tsx
// src/pages/AlexaLoginPage.tsx
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export function AlexaLoginPage() {
  const [searchParams] = useSearchParams();
  const sessionCode = searchParams.get('session_code');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!sessionCode) {
    return <p>Acesso inválido.</p>;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await axios.post('/auth/oauth/login', {
        email,
        password,
        session_code: sessionCode,
      });

      // Redireciona para a URL do assistente de voz (ex: Alexa)
      window.location.href = data.redirectUrl;
    } catch {
      setError('Email ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="oauth-login-page">
      <h1>Conectar ao Assistente de Voz</h1>
      <p>Entre com sua conta para autorizar o acesso.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Autorizando...' : 'Autorizar'}
        </button>
      </form>
    </div>
  );
}
```

#### Registrar a rota no Router

```tsx
// src/App.tsx (ou onde está o Router)
import { AlexaLoginPage } from './pages/AlexaLoginPage';

// Dentro das rotas:
<Route path="/alexa-login" element={<AlexaLoginPage />} />
```

> Esta rota deve ser **pública** (sem guard de autenticação), pois o usuário ainda não está logado no app quando chega aqui via Alexa.

### Botão de Desconectar Integração

```tsx
async function unlinkAlexa() {
  await axios.post('/profile/integrations/alexa/unlink', {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // atualizar estado local
}
```

---

## Configuração no Alexa Developer Console

1. Em **Account Linking**, selecionar **Auth Code Grant**.
2. Preencher:
   - **Authorization URI:** `https://sua-api.com/auth/oauth/authorize`
   - **Access Token URI:** `https://sua-api.com/auth/oauth/token`
   - **Client ID:** valor do `clientId` cadastrado no banco (ex: `alexa-skill-prod`)
   - **Client Secret:** o secret em texto puro (antes de gerar o hash)
   - **Scope:** `profile` (ou qualquer valor — a API aceita qualquer string)
   - **Authentication Scheme:** `Credentials in request body`
3. Copiar as **Redirect URLs** geradas pela Alexa e inserir no campo `redirectUris` do registro no banco.

---

## Configuração no Google Actions Console (futuro)

1. Em **Account Linking**, selecionar **OAuth** → **Authorization code**.
2. Preencher:
   - **Authorization URL:** `https://sua-api.com/auth/oauth/authorize`
   - **Token URL:** `https://sua-api.com/auth/oauth/token`
   - **Client ID:** `google-assistant-prod`
   - **Client Secret:** o secret em texto puro
3. Copiar a **Redirect URI** (`https://oauth-redirect.googleusercontent.com/r/SEU_PROJECT_ID`) e inserir no banco.

---

## Segurança

- O `clientSecret` é armazenado como **hash bcrypt** — nunca em texto puro.
- O `redirect_uri` é validado contra a **whitelist** do `oauth_client` — previne ataques de Open Redirect.
- O `auth_code` expira em **5 minutos** e é destruído após o primeiro uso.
- O `session_code` é mantido **somente em memória** com TTL de **10 minutos**.
- O `refresh_token` é um UUID opaco armazenado em `user.refreshtoken` — rotacionado a cada uso.
- O `access_token` (JWT) expira em **1 hora** (`expires_in: 3600`) — a Alexa renova automaticamente via `refresh_token`.
