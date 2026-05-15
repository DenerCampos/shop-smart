# Renovação do Refresh Token do Google Drive

O erro `invalid_grant` na API indica que o `GOOGLE_DRIVE_REFRESH_TOKEN` expirou ou foi revogado.
Siga os passos abaixo para gerar um novo token.

---

## Passo a Passo

### 1. Acesse o OAuth Playground

Vá para: [https://developers.google.com/oauthplayground](https://developers.google.com/oauthplayground)

---

### 2. Configure suas credenciais OAuth

1. Clique no ícone de **engrenagem** (⚙️) no canto superior direito
2. Marque a opção **"Use your own OAuth credentials"**
3. Preencha os campos:
   - **OAuth Client ID**: valor de `GOOGLE_DRIVE_CLIENT_ID` no `.env`
   - **OAuth Client Secret**: valor de `GOOGLE_DRIVE_CLIENT_SECRET` no `.env`

---

### 3. Selecione os escopos da Drive API

No painel esquerdo, localize **"Drive API v3"** e selecione um dos escopos:

- `https://www.googleapis.com/auth/drive` — acesso completo
- `https://www.googleapis.com/auth/drive.file` — apenas arquivos criados pelo app (recomendado)

---

### 4. Autorize as APIs

Clique em **"Authorize APIs"** e faça login com a conta Google que tem acesso à pasta do Drive.

> Na URL de autorização gerada, verifique se os parâmetros `access_type=offline` e `prompt=consent` estão presentes.
> Eles garantem que um **novo** refresh token será emitido mesmo que um anterior já exista.
> Se não estiverem, adicione-os manualmente à URL antes de confirmar.

---

### 5. Troque o código pelo token

Após conceder as permissões, clique em **"Exchange authorization code for tokens"**.

---

### 6. Copie o novo Refresh Token

O painel exibirá os tokens gerados. Copie o valor do campo **`refresh_token`**.

---

### 7. Atualize o `.env`

Substitua o valor atual pela nova string:

```env
GOOGLE_DRIVE_REFRESH_TOKEN=seu_novo_refresh_token_aqui
```

Faça o mesmo no arquivo `.env producao` e em qualquer outro ambiente (ex.: variáveis de ambiente do servidor de produção).

---

### 8. Reinicie a API

```bash
# Desenvolvimento
npm run start:dev

# Produção (Docker)
docker compose restart api
```

---

## Quando isso acontece novamente?

| Situação | Ação necessária |
|---|---|
| Senha da conta Google alterada | Gerar novo token |
| Token revogado manualmente no Google Account | Gerar novo token |
| App em modo de teste no Google Cloud (expira em 7 dias) | Publicar o app ou gerar novo token |
| Token sem uso por mais de 6 meses | Gerar novo token |

---

## Referências

- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
- [Google Drive API Scopes](https://developers.google.com/drive/api/guides/api-specific-auth)
- [Tokens de atualização do OAuth 2.0](https://developers.google.com/identity/protocols/oauth2#expiration)
