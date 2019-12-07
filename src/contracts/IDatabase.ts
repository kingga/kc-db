import { ValueType } from '../types';
import { IBuilder } from './IBuilder';

/**
 * This is the base database which the user will be using, once they use
 * `.table()` they will then retrieve the builder.
 */
export interface IDatabase {
  table(table: string): IBuilder;
  query<T>(query: string, bindings?: ValueType[]): Promise<T[]>;
}
