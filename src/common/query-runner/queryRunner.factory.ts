import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { QueryRunnerInterface } from './queryRunner.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class QueryRunnerFactory implements QueryRunnerInterface {
  private readonly dataSource: DataSource;
  private queryRunner: QueryRunner;
  public manager: EntityManager;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.queryRunner = this.dataSource.createQueryRunner();
    this.manager = this.queryRunner.manager;
  }

  async startTransaction() {
    console.log(
      'startTransaction -> this.queryRunner.isReleased: ',
      this.queryRunner.isReleased,
    );
    await this.queryRunner.connect();
    return this.queryRunner.startTransaction();
  }

  async commitTransaction() {
    return this.queryRunner.commitTransaction();
  }

  async rollbackTransaction() {
    return this.queryRunner.rollbackTransaction();
  }
}
