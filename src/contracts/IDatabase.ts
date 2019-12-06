import { IBuilder } from './IBuilder';

export interface IDatabase {
  table(table: string): IBuilder;
  query<T>(query: string, bindings: any[]): Promise<T[]>;
}
