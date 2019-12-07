import { IBuilder } from '../../src/contracts/IBuilder';
import { IDatabase } from '../../src/contracts/IDatabase';
import { Database } from '../../src/Database';
import { getConfig } from './connection';

export type BuilderConstructor = new (db: IDatabase) => IBuilder;

export function makeDB(cls?: BuilderConstructor): IDatabase {
  return new Database(getConfig(), cls);
}
