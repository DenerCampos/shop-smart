export function buildImageRevenuePrompt(): string {
  return `Analise esta imagem de um comprovante, recibo ou documento de receita/entrada financeira e extraia as seguintes informações em formato JSON:
        - name: descrição da receita (ex: Salário, Freelance, Venda, Comissão)
          IMPORTANTE: Converta o nome (name) para "Title Case" (apenas iniciais maiúsculas), remova abreviações excessivas e tente deduzir o nome completo e amigável da descrição.
          Ao expandir abreviações, use apenas o contexto presente no texto. Se não tiver certeza absoluta do nome completo, apenas converta para 'Title Case' e remova caracteres especiais.
        - value: valor total da receita (número)
        - date: data da receita (formato: YYYY-MM-DD), se não for possível identificar, retorne a data atual no Brasil/America do Sul
        - repeat: boolean indicando se é uma receita recorrente (ex: salário mensal = true, venda única = false)
        
        IMPORTANTE: 
        - Todas as chaves devem estar em inglês (name, value, date, repeat).
        - Se a imagem mencionar algo como "mensal", "recorrente", "fixo", defina repeat como true
        - Se não for possível identificar se é recorrente, assuma false
        - Retorne apenas o JSON, sem explicações adicionais.`;
}

export function buildImageExpensePrompt(
  groups: string,
  payment: string,
): string {
  return `Analise esta imagem de um cupom fiscal ou nota fiscal e extraia as seguintes informações em formato JSON:
        - name: nome do estabelecimento
        - value: valor total da nota (número)
        - date: data da compra (formato: YYYY-MM-DD), se não for possível identificar, retorne a data atual no Brasil/America do Sul
        - items: array de produtos, cada item deve conter:
          * code: código do produto, se não for possível identificar, retorne '1'
          * name: nome do produto
          IMPORTANTE: Converta o nome (name) para "Title Case" (apenas iniciais maiúsculas), remova abreviações excessivas e tente deduzir o nome completo e amigável do produto (ex: de 'MAC VILM OV ESP' para 'Macarrão de Ovos Vilma Especial'). 
          Ao expandir abreviações, use apenas o contexto presente no texto. Se não tiver certeza absoluta do nome completo, apenas converta para 'Title Case' e remova caracteres especiais.
          Mantenha informações de peso/volume/unidade (ex: 500g, 1L,1U).
          * quantity: quantidade (número), se não for possível identificar, retorne 0
          * unit: unidade - use 'unidade' para UN, 'quilograma' para KG, ou 'pacote' para PT, se não for possível identificar, retorne 'unidade'
          * value: valor unitário (número), se não for possível identificar, retorne 0
          * total: valor total do item (número), se não for possível identificar, retorne 0
          * group: objeto com a propriedade 'name' contendo o nome do grupo de classificação. Os grupos possíveis são: ${groups}
        - store: objeto com a propriedade 'name' contendo o nome do estabelecimento
        - payment: objeto com a propriedade 'name' contendo o nome do método de pagamento. Se não for possível identificar, use '${payment}'
        
        IMPORTANTE: Todas as chaves devem estar em inglês (code, name, quantity, unit, value, total, group, store, payment, name).
        Retorne apenas o JSON, sem explicações adicionais.`;
}
