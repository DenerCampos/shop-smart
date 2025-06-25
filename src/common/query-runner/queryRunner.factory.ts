import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { QueryRunnerInterface } from './queryRunner.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryRunnerFactory implements QueryRunnerInterface {
  private queryRunner: QueryRunner;
  public manager: EntityManager;

  constructor(private dataSource: DataSource) {}

  async startTransaction(): Promise<void> {
    // Cria novo QueryRunner para cada transação
    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    this.manager = this.queryRunner.manager;
  }

  async commitTransaction(): Promise<void> {
    if (this.queryRunner?.isTransactionActive) {
      await this.queryRunner.commitTransaction();
    }
    await this.release();
  }

  async rollbackTransaction(): Promise<void> {
    if (this.queryRunner?.isTransactionActive) {
      await this.queryRunner.rollbackTransaction();
    }
    await this.release();
  }

  private async release(): Promise<void> {
    if (this.queryRunner && !this.queryRunner.isReleased) {
      await this.queryRunner.release();
    }
  }
}
