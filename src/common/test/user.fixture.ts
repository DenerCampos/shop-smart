import { User } from 'src/user/entities/user.entity';

/** Usuário mínimo para testes unitários (sem persistir). */
export function createTestUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-test-1',
    name: 'Usuário Teste',
    email: 'user@test.local',
    family: 'Família',
    coatOfArms: 'brasao',
    password: 'hashed',
    token: null,
    refreshtoken: null,
    profileImage: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    ...overrides,
  } as User;
}

/** Alias para leitura nos specs. */
export const getUser = createTestUser;
