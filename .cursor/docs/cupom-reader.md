# Cupom Reader

Módulo responsável pela leitura de cupons fiscais eletrônicos (NFC-e) via QR Code.
Busca o HTML do portal estadual, extrai o texto limpo com Cheerio e delega a análise estruturada ao `TextRecognitionService` (Gemini via `GeminiTextProvider`).

## Endpoint

```
POST /coupon-reader
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "url": "https://portalsped.fazenda.mg.gov.br/portalnfce/sistema/qrcode.xhtml?p=..."
}
```

- Aceita a **URL completa** retornada pelo scanner de QR Code
- Funciona para **qualquer estado** (não mais restrito ao portal de MG)
- Requer autenticação JWT

## Fluxo

```
POST /coupon-reader { url }
         │
         ▼
CouponReaderController
         │  @Body url + @CurrentUser user
         ▼
CouponReaderService.read(url, user)
         │
         ├── axios.get(url) → HTML da página do portal estadual
         ├── Cheerio: extrai texto limpo de .container
         │
         ├── TextRecognitionService.parseCoupon(text, user)
         │       ├── groupService.findAllNames(user) → grupos do usuário
         │       ├── GeminiTextProvider.parseCoupon(text, { groups })
         │       │       └── Prompt + texto → JSON estruturado (CouponTextResult)
         │       └── Persiste em TextRecognition (sourceText truncado em 500 chars)
         │
         ├── StoreService.getAllNames() + findSimilarString()
         │       └── Cruza nome do estabelecimento com lojas cadastradas pelo usuário
         │
         └── Retorna CouponTextResult + { uri: url }
```

## Resposta (`CouponReaderResponseDto`)

```json
{
  "uri": "https://portalsped.fazenda.mg.gov.br/...",
  "name": "Supermercado Exemplo",
  "date": "2026-04-13",
  "value": 87.50,
  "repeat": false,
  "store": { "name": "Supermercado Exemplo" },
  "payment": { "name": "Cartão de crédito" },
  "items": [
    {
      "code": "1262087",
      "name": "Arroz tipo 1 5kg",
      "quantity": 2,
      "unit": "unidade",
      "value": 18.90,
      "total": 37.80,
      "group": { "name": "Alimentação" }
    }
  ]
}
```

## Estrutura de Arquivos

```
src/coupon-reader/
├── couponReader.controller.ts   POST /coupon-reader, @CurrentUser, @Body
├── couponReader.service.ts      fetch HTML → Cheerio text → parseCoupon → store match
├── couponReader.module.ts       imports: CommonModule, UserModule, StoreModule, TextRecognitionModule
├── dto/
│   ├── create-coupon-reader.dto.ts      request: { url: string (IsUrl) }
│   ├── coupon-reader-response.dto.ts    response principal
│   └── coupon-reader-item-response.dto.ts  resposta por item
└── test/
    └── couponReader.controller.spec.ts
```

## Dependências

| Módulo | Uso |
|---|---|
| `TextRecognitionModule` | `parseCoupon()` — análise Gemini + persistência em `text_recognition` |
| `StoreModule` | `getAllNames()` — casamento fuzzy de nome do estabelecimento |
| `CommonModule` | `ResponseService` — mapeamento de DTO |
| `UserModule` | `AuthGuard` + `CurrentUser` decorator |

## Onde ficam as análises no banco

As chamadas de leitura de cupom são persistidas na tabela `text_recognition` (entidade `TextRecognition`), junto com as análises de itens de lista de compras — ambas são análises de texto via Gemini, semanticamente coerentes.

## Análise de Grupos via Gemini

O Gemini recebe os grupos cadastrados pelo usuário (`groupService.findAllNames(user)`) e classifica cada item semanticamente. Isso substitui a abordagem anterior de busca SQL por nome exato/parcial (`getGroupByItemName` / `getGroupByItemNamePartial`), resultando em classificações muito mais precisas.

Exemplo: `"DETERGENTE LIMPOL 500ML"` é classificado como `Limpeza` pelo Gemini, enquanto a busca SQL retornaria o fallback `Alimentação` por não ter histórico.

## Quota Gemini

Cada leitura de cupom consome 1 requisição da quota diária do `gemini-text` (configurada em `AppConfig.getGeminiTextDailyLimit()`), separada da quota de `image-recognition`. Consultar o uso via `GET /text-recognition/quota` (ou endpoint equivalente).

## Casamento de Loja (findSimilarString)

Após o Gemini extrair o nome do estabelecimento, o service aplica Jaro-Winkler (`findSimilarString`) contra as lojas já cadastradas pelo usuário. Se a similaridade for ≥ 70%, usa o nome da loja cadastrada — evitando duplicatas no cadastro de despesas.

## Reutilização do DTO

`CouponReaderResponseDto` é o formato base compartilhado com outros fluxos de análise:

- `AnalyzeExpenseImageResponseDto` — análise de imagem de nota via `/expense/analyze-image`
- `AnalyzeExpenseAudioResponseDto` — análise de áudio via `/expense/analyze-audio`
- `AnalyzeImageRecognitionResponseDto` — análise direta via `image-recognition`

## Frontend

| Antes | Depois |
|---|---|
| `GET /coupon-reader/<sufixo_p>` | `POST /coupon-reader` com body `{ "url": "<url_completa>" }` |
| Restrito ao portal de MG | Qualquer estado |

O scanner de QR Code retorna a URL completa do portal estadual — basta enviá-la no body sem nenhuma modificação.
