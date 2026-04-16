import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfig } from '../src/config/typeorm.config';

/**
 * Opções para o CLI (`migration:run`, `migration:generate`, `schema:drop`, …).
 * `autoLoadEntities` é só do @nestjs/typeorm — o `DataSource` nativo ignora e precisa de `entities`
 * para metadados (ex.: gerar migrações a partir das entidades).
 */
const nestOptions = new TypeOrmConfig().createTypeOrmOptions() as DataSourceOptions & {
  autoLoadEntities?: boolean;
};

const { autoLoadEntities: _ignored, ...rest } = nestOptions;

const dataSourceOptions: DataSourceOptions = {
  ...rest,
  entities: ['dist/**/*.entity.js'],
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
