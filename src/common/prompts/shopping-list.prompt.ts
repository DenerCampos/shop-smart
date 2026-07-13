export function buildShoppingListItemPrompt(
  groupsCsv: string,
  allowedUnits: string,
): string {
  return `Você interpreta uma linha de item de lista de compras em português (ex.: "3x leite", "500g queijo mussarela", "2 pacotes de arroz").

Categorias já existentes do usuário (use uma delas quando fizer sentido; copie o nome exatamente como aparece na lista): ${groupsCsv}

Retorne APENAS um JSON válido (sem markdown, sem texto extra), com as chaves em inglês:
{
  "name": "nome do produto sem quantidade/unidade (ex.: Leite)",
  "quantity": número (mínimo 0.01, padrão 1 se não houver quantidade),
  "unit": uma destas strings exatas: ${allowedUnits},
  "group": {
    "name": "nome da categoria em português",
    "isNew": boolean
  }
}

Regras:
- "isNew": false quando a categoria adequada está na lista de categorias existentes; nesse caso "group.name" DEVE ser exatamente um dos nomes da lista (mesma grafia).
- "isNew": true quando nenhuma categoria existente serve; proponha um nome curto para a nova categoria em português (ex.: Alimentação, Limpeza).
- Se não houver categorias cadastradas, use "isNew": true com um nome razoável.
- Unidade: infira do texto (kg, g, l, ml, pacotes → pack, dúzias → dz, peças → un).
- Não inclua comentários nem blocos \`\`\`json.`;
}

export function buildShoppingListBulkPrompt(
  groupsCsv: string,
  allowedUnits: string,
): string {
  return `Você interpreta uma lista de compras em português. O usuário pode enviar vários produtos em uma única linha, normalmente separados por vírgulas (ex.: "feijão, arroz, 3 óleos, papel higiênico").

Categorias já existentes do usuário (use uma delas quando fizer sentido; copie o nome exatamente como aparece na lista): ${groupsCsv}

Retorne APENAS um JSON válido (sem markdown, sem texto extra), com as chaves em inglês:
{
  "items": [
    {
      "name": "nome do produto sem quantidade/unidade",
      "quantity": número (mínimo 0.01, padrão 1),
      "unit": uma destas strings exatas: ${allowedUnits},
      "group": {
        "name": "nome da categoria em português",
        "isNew": boolean
      }
    }
  ]
}

Regras:
- Inclua um objeto em "items" para cada produto mencionado pelo usuário (ignore espaços vazios entre vírgulas).
- Mesmas regras de categoria e unidade que para um item único: "isNew": false só quando "group.name" for exatamente um nome da lista de categorias existentes; caso contrário "isNew": true com nome curto em português.
- Se não houver categorias cadastradas, use "isNew": true com nome razoável para cada item.
- Unidade: infira do texto (kg, g, l, ml, pacotes → pack, dúzias → dz, peças → un).
- Não inclua comentários nem blocos \`\`\`json.`;
}
