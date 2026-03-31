import {
  SHOPPING_LIST_ITEM_UNITS,
  ShoppingListItemUnit,
} from '../types/shopping-list-item-unit.type';

/** Mapeia texto vindo de sugestões (despesas) ou do cliente para unidades da lista. */
const UNIT_ALIASES: Record<string, ShoppingListItemUnit> = {
  un: 'un',
  kg: 'kg',
  g: 'g',
  l: 'l',
  ml: 'ml',
  pack: 'pack',
  dz: 'dz',
  unidade: 'un',
  unidades: 'un',
  quilos: 'kg',
  quilo: 'kg',
  gramas: 'g',
  grama: 'g',
  litro: 'l',
  litros: 'l',
  mililitro: 'ml',
  mililitros: 'ml',
  pacote: 'pack',
  pacotes: 'pack',
  duzia: 'dz',
  dúzia: 'dz',
  duzias: 'dz',
};

export function normalizeShoppingListItemUnit(
  value: unknown,
): ShoppingListItemUnit {
  if (value === undefined || value === null || value === '') {
    return 'un';
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    return 'un';
  }
  const raw = String(value).trim().toLowerCase();
  if (SHOPPING_LIST_ITEM_UNITS.includes(raw as ShoppingListItemUnit)) {
    return raw as ShoppingListItemUnit;
  }
  return UNIT_ALIASES[raw] ?? 'un';
}
