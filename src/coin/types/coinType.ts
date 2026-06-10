export type coinType = 'coupon' | 'imagem' | 'theme' | 'color' | 'revenue';

export enum TransactionType {
  EARN = 'earn',
  SPEND = 'spend',
  BONUS = 'bonus',
  PENALTY = 'penalty',
  REFUND = 'refund',
}

export enum coinTransactionDescription {
  COUPON = 'Ganhou moedas por adicionar um novo cupom',
  IMAGEM = 'Gastou moedas por comprar uma nova imagem',
  THEME = 'Gastou moedas por comprar um novo tema',
  COLOR = 'Gastou moedas por comprar uma nova cor',
  REVENUE = 'Ganhou moedas por adicionar uma nova receita',
}
