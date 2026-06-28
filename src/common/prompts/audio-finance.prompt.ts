export function buildAudioRevenuePrompt(): string {
  return `Você é um assistente que analisa áudios de receitas/entradas financeiras.
        O usuário vai descrever uma receita verbalmente (salário, freelance, venda, etc).

        Extraia as seguintes informações e retorne APENAS um JSON válido (sem markdown, sem explicações):
        {
          "name": "descrição da receita (ex: Salário, Freelance, Venda de produto)",
          "value": valor total numérico da receita,
          "date": "data da receita no formato YYYY-MM-DD (se não mencionada, use a data de hoje no Brasil/America do Sul)",
          "repeat": boolean indicando se é uma receita recorrente (ex: salário mensal = true)
        }

        IMPORTANTE:
        - Todas as chaves devem estar em inglês (name, value, date, repeat)
        - Se não mencionar se é recorrente, assuma false
        - Se mencionar palavras como "mensal", "todo mês", "fixo", defina repeat como true
        - Retorne APENAS o JSON, sem \`\`\`json ou qualquer marcação
        - Se não mencionar a data, use a data atual no Brasil/America do Sul no formato YYYY-MM-DD no campo date (ex: 2025-12-05)
        `;
}

export function buildAudioExpensePrompt(
  groups: string,
  payment: string,
): string {
  return `Você é um assistente que analisa áudios de despesas.
        O usuário vai descrever uma despesa verbalmente (compra em estabelecimento).

        Extraia as seguintes informações e retorne APENAS um JSON válido (sem markdown, sem explicações):
        {
          "name": "descrição da despesa/compra",
          "value": valor total numérico da compra,
          "date": "data da compra no formato YYYY-MM-DD (se não mencionada, use a data atual no Brasil/America do Sul)",
          "repeat": boolean indicando se é uma despesa recorrente,
          "items": [
            {
              "code": "código do produto (use '1' se não mencionado)",
              "name": "nome do produto",
              "quantity": quantidade numérica,
              "unit": "unidade (unidade, quilograma, ou pacote)",
              "value": valor unitário numérico,
              "total": valor total do item (quantity * value),
              "group": {
                "name": "categoria do produto - ESCOLHA entre: ${groups}"
              }
            }
          ],
          "store": {
            "name": "nome do estabelecimento/loja"
          },
          "payment": {
            "name": "forma de pagamento (use '${payment}' se não mencionado)"
          }
        }

        IMPORTANTE:
        - Todas as chaves devem estar em inglês
        - Se o usuário mencionar múltiplos produtos, inclua todos no array items
        - Se não mencionar quantidade, use 1
        - Se não mencionar valor unitário mas mencionar total, calcule
        - Se mencionar apenas o total geral, crie um item único com esse valor
        - Retorne APENAS o JSON, sem \`\`\`json ou qualquer marcação
        - Se não mencionar a data, use a data de hoje no Brasil/America do Sul no formato YYYY-MM-DD no campo date (ex: 2025-11-24)
        `;
}
