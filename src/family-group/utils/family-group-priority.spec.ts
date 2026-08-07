import {
  pickPrimaryFamilyGroup,
  sortFamilyGroupsByPriority,
} from './family-group-priority';

describe('family-group-priority', () => {
  const userId = 'user-1';

  it('ordena owner → admin → member', () => {
    const sorted = sortFamilyGroupsByPriority(
      [
        {
          id: 'm1',
          name: 'Member Fam',
          ownerId: 'other',
          viewerRole: 'member',
          joinedAt: '2024-01-01',
        },
        {
          id: 'a1',
          name: 'Admin Fam',
          ownerId: 'other',
          viewerRole: 'admin',
          joinedAt: '2024-01-02',
        },
        {
          id: 'o1',
          name: 'Owner Fam',
          ownerId: userId,
          viewerRole: 'admin',
          joinedAt: '2024-01-03',
        },
      ],
      userId,
    );

    expect(sorted.map((g) => g.id)).toEqual(['o1', 'a1', 'm1']);
  });

  it('pickPrimary retorna a família owner', () => {
    const primary = pickPrimaryFamilyGroup(
      [
        {
          id: 'a1',
          name: 'Admin Fam',
          ownerId: 'other',
          viewerRole: 'admin',
        },
        {
          id: 'o1',
          name: 'Owner Fam',
          ownerId: userId,
          viewerRole: 'admin',
        },
      ],
      userId,
    );

    expect(primary?.id).toBe('o1');
  });
});
