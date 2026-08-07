import { FAMILY_GROUP_ROLES } from '../types/family-group-role.type';

export type FamilyGroupPriorityInput = {
  id: string;
  name: string;
  ownerId: string;
  /** Role do usuário autenticado neste grupo (accepted). */
  viewerRole: 'admin' | 'member';
  joinedAt?: Date | string | null;
};

function roleRank(group: FamilyGroupPriorityInput, userId: string): number {
  if (group.ownerId === userId) return 0;
  if (group.viewerRole === FAMILY_GROUP_ROLES.ADMIN) return 1;
  return 2;
}

function joinedAtTime(group: FamilyGroupPriorityInput): number {
  if (!group.joinedAt) return Number.MAX_SAFE_INTEGER;
  const t = new Date(group.joinedAt).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

/** Ordena: owner → admin → member; desempate por joinedAt depois nome. */
export function sortFamilyGroupsByPriority<T extends FamilyGroupPriorityInput>(
  groups: T[],
  userId: string,
): T[] {
  return [...groups].sort((a, b) => {
    const rankDiff = roleRank(a, userId) - roleRank(b, userId);
    if (rankDiff !== 0) return rankDiff;
    const joinedDiff = joinedAtTime(a) - joinedAtTime(b);
    if (joinedDiff !== 0) return joinedDiff;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

export function pickPrimaryFamilyGroup<T extends FamilyGroupPriorityInput>(
  groups: T[],
  userId: string,
): T | null {
  const sorted = sortFamilyGroupsByPriority(groups, userId);
  return sorted[0] ?? null;
}
