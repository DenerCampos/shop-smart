export function buildCouponTextPrompt(
  text: string,
  groups: string,
  payment: string,
): string {
  return `Analise o texto abaixo de um cupom fiscal ou nota fiscal eletrônica e extraia as seguintes informações em formato JSON:
- name: nome do estabelecimento
- value: valor total da nota (número)
- date: data da compra (formato: YYYY-MM-DD), se não for possível identificar, retorne a data atual no Brasil/America do Sul
- repeat: sempre false
- items: array de produtos, cada item deve conter:
  * code: código do produto, se não for possível identificar, retorne '1'
  * name: nome do produto formatado. 
    IMPORTANTE: Converta o nome para "Title Case" (apenas iniciais maiúsculas), remova abreviações excessivas e tente deduzir o nome completo e amigável do produto (ex: de 'MAC VILM OV ESP' para 'Macarrão de Ovos Vilma Especial'). 
    Ao expandir abreviações, use apenas o contexto presente no texto. Se não tiver certeza absoluta do nome completo, apenas converta para 'Title Case' e remova caracteres especiais.
    Mantenha informações de peso/volume (ex: 500g, 1L).
  * quantity: quantidade (número), se não for possível identificar, retorne 0
  * unit: unidade - use 'unidade' para UN, 'quilograma' para KG, ou 'pacote' para PT, se não for possível identificar, retorne 'unidade'
  * value: valor unitário (número), se não for possível identificar, retorne 0
  * total: valor total do item (número), se não for possível identificar, retorne 0
  * group: objeto com a propriedade 'name' contendo o nome do grupo de classificação. Os grupos possíveis são: ${groups}
- store: objeto com a propriedade 'name' contendo o nome do estabelecimento
- payment: objeto com a propriedade 'name' contendo o nome do método de pagamento. Se não for possível identificar, use '${payment}'

IMPORTANTE: Todas as chaves devem estar em inglês (code, name, quantity, unit, value, total, group, store, payment).
Retorne apenas o JSON, sem explicações adicionais.

Texto do cupom:
${text}`;
}
