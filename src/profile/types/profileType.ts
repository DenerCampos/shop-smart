export type coinsType = 'coupon' | 'group' | 'payment' | 'store';

export type registrarionsType = 'expense' | 'revenue';

export type financialDataType = {
  expenses: number;
  typeCoins: coinsType;
};
