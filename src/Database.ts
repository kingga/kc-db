import { IDatabase } from './contracts/IDatabase';
import { IConfig } from '@kingga/kc-config';
import { IBuilder } from './contracts/IBuilder';
import { MySQLBuilder } from './MySQL/MySQLBuilder';
import { InternalQueryReturnType } from './MySQL/contracts/ReturnTypes';
import * as mysql from 'mysql2/promise';

type BuilderContructor = new (db: IDatabase) => IBuilder;

export class Database implements IDatabase {
  protected config: IConfig;
  protected builder: BuilderContructor;

  public constructor(config: IConfig, builder?: BuilderContructor) {
    if (!config.get('db')) {
      throw new Error("The database configuration has not been loaded, please use the tag 'db'.");
    }

    this.config = config;
    this.builder = builder || MySQLBuilder;
  }

  public table(table: string): IBuilder {
    return new this.builder(this).table(table);
  }

  public async query<T>(query: string, bindings: any[]): Promise<T> {
    const { results } = await this.internalQuery<T>(query, bindings);

    return results;
  }

  protected async internalQuery<T>(query: string, bindings: any[]): Promise<InternalQueryReturnType<T>> {
    const connection = await mysql.createConnection({
      host: this.config.get('db.host'),
      user: this.config.get('db.user'),
      password: this.config.get('db.password'),
      database: this.config.get('db.database'),
      port: this.config.get('db.port', 3306),
    });

    const [results, fields] = await connection.query(query, bindings);
    connection.end();

    return { results, fields };
  }
}
