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

/** Lista de itens interpretada em uma única chamada ao modelo. */
export interface ShoppingListItemTextAiResultArray {
  items: ShoppingListItemTextAiResult[];
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

// ─── Tipos de saúde ──────────────────────────────────────────────────────────

export type HealthExamType =
  | 'LABORATORY'
  | 'IMAGING'
  | 'FUNCTIONAL'
  | 'PROCEDURE'
  | 'OTHER';

/** Item extraído de um exame de saúde (laboratorial ou de imagem). */
export interface ExtractedExamItem {
  itemName: string;
  material?: string;
  method?: string;
  resultValue?: string;
  resultUnit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  /** Observação curta do laudo sobre o analito (laboratório). */
  itemNotes?: string;
  findings?: string;
  conclusion?: string;
}

/** Dados extraídos de um exame de saúde via IA. */
export interface ExtractedExamData {
  labName?: string;
  doctorName?: string;
  examDate?: string;
  examType?: HealthExamType;
  items: ExtractedExamItem[];
}

// ─── Receituário ─────────────────────────────────────────────────────────────

export interface ExtractedPrescriptionItem {
  medicationName: string;
  dosage?: string;
  scheduleTimes?: string[];
  daysOfWeek?: string[] | null;
  startDate?: string;
  endDate?: string | null;
  notes?: string;
}

/** Dados extraídos de receituário médico via IA. */
export interface ExtractedPrescriptionData {
  doctorName?: string;
  prescriptionDate?: string;
  notes?: string;
  items: ExtractedPrescriptionItem[];
}
