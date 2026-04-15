import { ObjectLiteral, Repository } from 'typeorm';

/**
 * Mock mínimo de {@link Repository} para testes sem banco (Nest + Jest).
 * Completar com `mockReturnValue` / `mockResolvedValue` conforme o caso.
 */
export function createRepositoryMock<
  Entity extends ObjectLiteral,
>(): jest.Mocked<
  Pick<
    Repository<Entity>,
    | 'findOne'
    | 'find'
    | 'save'
    | 'create'
    | 'delete'
    | 'remove'
    | 'createQueryBuilder'
  >
> {
  return {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((e) => e as Entity),
    delete: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  } as unknown as jest.Mocked<
    Pick<
      Repository<Entity>,
      | 'findOne'
      | 'find'
      | 'save'
      | 'create'
      | 'delete'
      | 'remove'
      | 'createQueryBuilder'
    >
  >;
}

/** Encadeamento simples de QueryBuilder para `getOne` / `getMany`. */
export function mockQueryBuilderChain<T>(one?: T, many: T[] = []) {
  const qb: Record<string, jest.Mock> = {
    innerJoinAndSelect: jest.fn(),
    leftJoinAndSelect: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getOne: jest.fn().mockResolvedValue(one),
    getMany: jest.fn().mockResolvedValue(many),
  };
  for (const k of Object.keys(qb)) {
    if (k !== 'getOne' && k !== 'getMany') {
      qb[k].mockReturnValue(qb);
    }
  }
  return qb;
}
