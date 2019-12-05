import * as mysql from 'mysql';
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
  return new Promise((resolve, reject) => {
    const con = mysql.createConnection(config || getConfig().get('db'));

    con.connect({}, (err) => {
      if (err) {
        return reject(err);
      }

      resolve(con);
    });
  });
}
