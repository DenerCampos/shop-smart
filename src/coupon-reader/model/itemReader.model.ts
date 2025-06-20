enum UnitType {
  KG = 'kg',
  G = 'g',
  UN = 'un',
  L = 'l',
  ML = 'ml',
  PT = 'pt',
  PC = 'pc', // Peça
  CX = 'cx', // Caixa
  SC = 'sc', // Saco
  FD = 'fd', // Fardo
}

export class ItemReaderModel {
  code: string;
  name: string;
  quantity: number;
  unit: string;
  value: number;
  total: number;
  group: string;

  unitLabels: Record<string, string> = {
    [UnitType.KG]: 'Quilograma',
    [UnitType.G]: 'Grama',
    [UnitType.UN]: 'Unidade',
    [UnitType.L]: 'Litro',
    [UnitType.ML]: 'Mililitro',
    [UnitType.PT]: 'Pacote',
    [UnitType.PC]: 'Peça',
    [UnitType.CX]: 'Caixa',
    [UnitType.SC]: 'Saco',
    [UnitType.FD]: 'Fardo',
  } as const;

  defaultUnit = UnitType.UN;
  defaultGroup = 'Alimentação';

  constructor(data: Partial<ItemReaderModel>) {
    this.code = data.code;
    this.name = this.capitalize(data.name);
    this.quantity = data.quantity;
    this.unit = this.getUnitValue(data.unit);
    this.value = data.value;
    this.total = data.total;
    this.group = data.group || this.defaultGroup;
  }

  private getUnitValue(value: string): string {
    if (!value || typeof value !== 'string') {
      return this.unitLabels[this.defaultUnit];
    }

    const normalizedValue = value.trim().toLowerCase();

    return (
      this.unitLabels[normalizedValue] || this.unitLabels[this.defaultUnit]
    );
  }

  private capitalize(str: string): string {
    if (!str || typeof str !== 'string') {
      return '';
    }

    const trimmedStr = str.trim();

    if (trimmedStr.length === 0) {
      return '';
    }

    return (
      trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1).toLowerCase()
    );
  }
}
