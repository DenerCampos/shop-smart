/** Nome usado quando o cupom não tem estabelecimento nem itens classificados. */
export const GENERIC_COUPON_STORE_NAME = 'Compra não identificada';

/** Categorias padrão do prompt de cupom, usadas na allowlist do fallback. */
export const DEFAULT_COUPON_GROUP_NAMES = [
  'Alimentação',
  'Bebida',
  'Limpeza',
  'Higiene',
  'Outros',
] as const;

/** Primeiro nome de estabelecimento não vazio entre os candidatos da IA. */
export function pickCouponStoreName(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function normalizeGroupKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildAllowMap(allowedGroups: readonly string[]): Map<string, string> {
  const allowMap = new Map<string, string>();
  for (const group of allowedGroups) {
    if (typeof group !== 'string' || !group.trim()) {
      continue;
    }
    const key = normalizeGroupKey(group);
    if (!allowMap.has(key)) {
      allowMap.set(key, group.trim());
    }
  }
  return allowMap;
}

/**
 * Nome genérico derivado da categoria predominante dos itens do cupom
 * (ex.: "Compra de Alimentação"), usado quando a IA não identifica o
 * estabelecimento — o fluxo do QR Code não pode retornar nome vazio.
 *
 * Só conta categorias presentes em `allowedGroups` (grupos do usuário ou
 * {@link DEFAULT_COUPON_GROUP_NAMES}). Em empate de contagem, vence a
 * categoria que aparece primeiro nos itens.
 */
export function buildFallbackCouponStoreName(
  items: unknown,
  allowedGroups: readonly string[] = DEFAULT_COUPON_GROUP_NAMES,
): string {
  const list = Array.isArray(items) ? items : [];
  const allowMap = buildAllowMap(allowedGroups);
  const countByGroup = new Map<string, number>();

  for (const item of list) {
    const group = (item as { group?: { name?: unknown } } | null)?.group;
    const groupName = typeof group?.name === 'string' ? group.name.trim() : '';
    if (!groupName) {
      continue;
    }
    const canonical = allowMap.get(normalizeGroupKey(groupName));
    if (!canonical) {
      continue;
    }
    countByGroup.set(canonical, (countByGroup.get(canonical) ?? 0) + 1);
  }

  let predominant: string | null = null;
  let predominantCount = 0;
  for (const [groupName, count] of countByGroup) {
    // Empate: mantém a primeira categoria (`>` e não `>=`).
    if (count > predominantCount) {
      predominant = groupName;
      predominantCount = count;
    }
  }

  return predominant ? `Compra de ${predominant}` : GENERIC_COUPON_STORE_NAME;
}
