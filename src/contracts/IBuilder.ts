import { ConditionType, JoinCallable, OrderDirection, ValueType } from '../types';
import { IWhereBuilder } from './IWhereBuilder';
import { IRaw } from './IRaw';
import { IDatabase } from './IDatabase';

export type SubQueryBuilder = (query: IDatabase) => IBuilder;
export type SubQueryArg = SubQueryBuilder | IBuilder | IRaw;

export interface IBuilder extends IWhereBuilder<IBuilder> {
  table(table: string): IBuilder;

  // Select.
  distinct(): IBuilder;
  groupBy(column: string): IBuilder;
  orderBy(column: string, direction?: OrderDirection): IBuilder;
  // orderByDesc(column: string): IBuilder;
  having(column: string, condition: ConditionType, value: ValueType): IBuilder;
  // orHaving(column: string, condition: ConditionType, value: ValueType): IBuilder;
  havingRaw(raw: string): IBuilder;
  // orHavingRaw(raw: string): IBuilder;
  limit(count: number, offset?: number): IBuilder;
  select(columns: string[] | string): IBuilder;
  selectRaw(column: string): IBuilder;
  get<T extends object>(columns?: string[]): Promise<T[]>;
  first<T extends object>(columns?: string[]): Promise<T | null>;
  // find<T extends object>(id: number, columns?: string[]): Promise<T | null>;
  // value<T>(column: string): Promise<T | null>;
  // exists(): Promise<boolean>;

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
  // truncate(): Promise<void>;

  // Update.
  update<T extends Record<string, ValueType>>(values: T): Promise<void>;
  // updateOrInsert<T extends Record<string, ValueType>>(values: T): Promise<void>;
  // increment(column: string, amount?: number): Promise<void>;
  // decrement(column: string, amount?: number): Promise<void>;

  // Aggregates.
  count(column?: string): Promise<number>;
  max(column: string): Promise<number>;
  min(column: string): Promise<number>;
  avg(column: string): Promise<number>;
  // average(column: string): Promise<number>;
  sum(column: string): Promise<number>;

  // // Sub queries.
  // selectSub(builder: SubQueryArg): IBuilder;
  // fromSub(builder: SubQueryArg): IBuilder;
  // joinSub(builder: SubQueryArg): IBuilder;
  // leftJoinSub(builder: SubQueryArg): IBuilder;
  // rightJoinSub(builder: SubQueryArg): IBuilder;

  // // Ordering.
  // latest(column?: string): IBuilder;
  // oldest(column?: string): IBuilder;

  // // Limiting.
  // skip(amount: number): IBuilder;
  // offset(offset: number): IBuilder;
  // take(amount: number): IBuilder;
  // forPage(page: number, perPage?: number): IBuilder;

  // Debugging.
  toSql(): string;
  getBindings(): ValueType[];
  getStatement(): IRaw;
}
