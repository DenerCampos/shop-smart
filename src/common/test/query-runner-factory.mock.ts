import { QueryRunnerFactory } from 'src/common/query-runner/queryRunner.factory';

/** Mock de transação sem {@link DataSource}. */
export function createQueryRunnerFactoryMock(): Pick<
  QueryRunnerFactory,
  'startTransaction' | 'commitTransaction' | 'rollbackTransaction' | 'manager'
> {
  const manager = {} as QueryRunnerFactory['manager'];
  return {
    manager,
    startTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
  };
}
