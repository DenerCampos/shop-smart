export enum TextRecognitionStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/** Resposta estruturada do provedor (após JSON). */
export interface ShoppingListItemTextAiResult {
  name: string;
  quantity: number;
  unit: string;
  group: {
    name: string;
    isNew: boolean;
  };
  confidence: number;
  provider: string;
}

/** Resultado para uso na lista de compras (grupo já resolvido no banco). */
export interface ParsedShoppingListItemFromText {
  name: string;
  quantity: number;
  unit: string;
  groupId?: string;
}

/** Item de cupom fiscal extraído pelo provedor de texto. */
export interface CouponTextItem {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: number;
  total: number;
  group: { name: string };
}

/** Resultado completo de um cupom fiscal extraído via análise de texto. */
export interface CouponTextResult {
  name: string;
  value: number;
  date: string;
  repeat: boolean;
  items: CouponTextItem[];
  store: { name: string };
  payment: { name: string };
  confidence: number;
  provider: string;
}
