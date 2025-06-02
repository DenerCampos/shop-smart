export type coinType =
  | 'coupon'
  | 'group'
  | 'payment'
  | 'store'
  | 'resource'
  | 'imagem'
  | 'theme'
  | 'color';

export enum TransactionType {
  EARN = 'earn',
  SPEND = 'spend',
  BONUS = 'bonus',
  PENALTY = 'penalty',
  REFUND = 'refund',
}

export enum coinTransactionDescription {
  COUPON = 'Ganhou moedas por adicionar um novo cupom',
  GROUP = 'Ganhou moedas por adicionar um novo grupo',
  PAYMENT = 'Ganhou moedas por adicionar um novo pagamento',
  STORE = 'Ganhou moedas por adicionar uma nova loja',
  RESOURCE = 'Ganhou moedas por adicionar um novo recurso',
  IMAGEM = 'Gastou moedas por comprar uma nova imagem',
  THEME = 'Gastou moedas por comprar um novo tema',
  COLOR = 'Gastou moedas por comprar uma nova cor',
}
