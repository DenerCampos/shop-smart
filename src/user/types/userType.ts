export type userType = {
  id?: string;
  name: string;
  email: string;
};

export type profileType = {
  email: string;
  name: string;
  family: string;
  income: number;
  expenses: number;
  coins: number;
  coatOfArms: string;
  isFirstAccess: boolean;
};

export type coinsType = 'coupon' | 'group' | 'payment' | 'store';

export type financialDataType = {
  expenses: number;
  typeCoins: coinsType;
};
