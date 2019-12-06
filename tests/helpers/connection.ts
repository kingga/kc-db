import * as mysql from 'mysql2/promise';
import { IConfig, NonPersistentConfig } from '@kingga/kc-config';
import Container from '@kingga/kc-container';

export function getConfig(): IConfig {
  const container = new Container();
  const config = new NonPersistentConfig({
    db: {
      host: 'localhost',
      user: 'kc-db',
      password: 'secret',
      database: 'kc_db',
      port: 999,
    },
  }, container);

  return config;
}

export async function createDb(config?: IConfig): Promise<mysql.Connection> {
  const con = await mysql.createConnection(config || getConfig().get('db'));

  return con;
}
