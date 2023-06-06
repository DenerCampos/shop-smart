import { DataSource, DataSourceOptions } from 'typeorm';
import { TypeOrmConfig } from '../src/config/typeorm.config';

const dataSourceOptions =
  new TypeOrmConfig().createTypeOrmOptions() as DataSourceOptions;

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
