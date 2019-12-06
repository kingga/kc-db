import { IDatabase } from './IDatabase';

export type ConditionType = '=' | '<=>' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'NOT LIKE' | '!=' | '<>';
export type ValueTypes = string | number | null;
export type OrderDirection = 'DESC' | 'ASC';

export interface IWhereBuilder<T> {
  where(column: string, condition: ConditionType, value: ValueTypes): T;
  whereNull(column: string): T;
  whereNotNull(column: string): T;
  whereIn(column: string, values: ValueTypes[]): T;
  whereNotIn(column: string, values: ValueTypes[]): T;
  whereBetween(column: string, from: ValueTypes, to: ValueTypes): T;
  whereNotBetween(column: string, from: ValueTypes, to: ValueTypes): T;
  whereLike(column: string, value: string): T;
  whereNotLike(column: string, value: string): T;
  orWhere(column: string, condition: ConditionType, value: ValueTypes): T;
  orWhereNull(column: string): T;
  orWhereNotNull(column: string): T;
  orWhereIn(column: string, values: ValueTypes[]): T;
  orWhereNotIn(column: string, values: ValueTypes[]): T;
  orWhereBetween(column: string, from: ValueTypes, to: ValueTypes): T;
  orWhereNotBetween(column: string, from: ValueTypes, to: ValueTypes): T;
  orWhereLike(column: string, value: string): T;
  orWhereNotLike(column: string, value: string): T;
  whereRaw(raw: string): T;
  orWhereRaw(raw: string): T;
}

export interface IJoinBuilder extends IWhereBuilder<IJoinBuilder> {
  on(columnA: string, condition: ConditionType, columnB: string): IJoinBuilder;
  toSql(query: BindedQuery): void;
}

export type JoinCallable = (join: IJoinBuilder) => void;

export interface BindedQuery {
  sql: string;
  bindings: any[];
}

export interface IBuilder extends IWhereBuilder<IBuilder> {
  table(table: string): IBuilder;

  // Select.
  distinct(): IBuilder;
  groupBy(column: string): IBuilder;
  orderBy(column: string, direction: OrderDirection): IBuilder;
  having(column: string, condition: ConditionType, value: ValueTypes): IBuilder;
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
  insert<T extends Record<string, ValueTypes>>(data: T[]): Promise<void>;
  insertGetId<T extends Record<string, ValueTypes>>(data: T): Promise<number>;

  // Delete.
  delete(): Promise<void>;

  // Update.
  update<T extends Record<string, ValueTypes>>(values: T): Promise<void>;

  // Aggregates.
  count(column?: string): Promise<number>;
  max(column: string): Promise<number>;
  min(column: string): Promise<number>;
  avg(column: string): Promise<number>;
  sum(column: string): Promise<number>;
}
