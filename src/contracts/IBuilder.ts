import { ConditionType, JoinCallable, OrderDirection, ValueType } from '../types';
import { IWhereBuilder } from './IWhereBuilder';

export interface IBuilder extends IWhereBuilder<IBuilder> {
  table(table: string): IBuilder;

  // Select.
  distinct(): IBuilder;
  groupBy(column: string): IBuilder;
  orderBy(column: string, direction: OrderDirection): IBuilder;
  having(column: string, condition: ConditionType, value: ValueType): IBuilder;
  havingRaw(raw: string): IBuilder;
  limit(count: number, offset?: number): IBuilder;
  select(columns: string[]): IBuilder;
  selectRaw(column: string): IBuilder;
  get<T extends object>(columns?: string[]): Promise<T[]>;
  first<T extends object>(columns?: string[]): Promise<T | null>;

  // Joins.
  join(table: string, columnA: string, condition: ConditionType, columnB: string): IBuilder;
  join(table: string, join: JoinCallable): IBuilder;
  innerJoin(table: string, columnA: string, condition: ConditionType, columnB: string): IBuilder;
  innerJoin(table: string, join: JoinCallable): IBuilder;
  leftJoin(table: string, columnA: string, condition: ConditionType, columnB: string): IBuilder;
  leftJoin(table: string, join: JoinCallable): IBuilder;
  rightJoin(table: string, columnA: string, condition: ConditionType, columnB: string): IBuilder;
  rightJoin(table: string, join: JoinCallable): IBuilder;
  crossJoin(table: string): IBuilder;

  // Insert.
  insert<T extends Record<string, ValueType>>(data: T[]): Promise<void>;
  insertGetId<T extends Record<string, ValueType>>(data: T): Promise<number>;

  // Delete.
  delete(): Promise<void>;

  // Update.
  update<T extends Record<string, ValueType>>(values: T): Promise<void>;

  // Aggregates.
  count(column?: string): Promise<number>;
  max(column: string): Promise<number>;
  min(column: string): Promise<number>;
  avg(column: string): Promise<number>;
  sum(column: string): Promise<number>;
}
