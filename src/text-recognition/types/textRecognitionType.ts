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
