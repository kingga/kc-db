export type WhereCondition = '=' | '<=>' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'NOT LIKE' | '!=' | '<>';
export type WhereValue = string | number | null;
export type OrderDirection = 'DESC' | 'ASC';

export interface IWhereBuilder<T> {
  where(column: string, condition: WhereCondition, value: WhereValue): T;
  whereNull(column: string): T;
  whereNotNull(column: string): T;
  whereIn(column: string, values: WhereValue[]): T;
  whereNotIn(column: string, values: WhereValue[]): T;
  whereBetween(column: string, from: WhereValue, to: WhereValue): T;
  whereNotBetween(column: string, from: WhereValue, to: WhereValue): T;
  whereLike(column: string, value: string): T;
  whereNotLike(column: string, value: string): T;
  orWhere(column: string, condition: WhereCondition, value: WhereValue): T;
  orWhereNull(column: string): T;
  orWhereNotNull(column: string): T;
  orWhereIn(column: string, values: WhereValue[]): T;
  orWhereNotIn(column: string, values: WhereValue[]): T;
  orWhereBetween(column: string, from: WhereValue, to: WhereValue): T;
  orWhereNotBetween(column: string, from: WhereValue, to: WhereValue): T;
  orWhereLike(column: string, value: string): T;
  orWhereNotLike(column: string, value: string): T;
  whereRaw(raw: string): T;
  orWhereRaw(raw: string): T;
}

export interface IJoinBuilder extends IWhereBuilder<IJoinBuilder> {
  on(columnA: string, condition: WhereCondition, columnB: string): IJoinBuilder;
  toSql(): string;
}

export type JoinCallable = (join: IJoinBuilder) => void;

export interface IBuilder extends IWhereBuilder<IBuilder> {
  // General.
  table(table: string): IBuilder;
  query<T>(query: string): Promise<T[]>;

  // Select.
  distinct(): IBuilder;
  groupBy(column: string): IBuilder;
  orderBy(column: string, direction: OrderDirection): IBuilder;
  having(column: string, condition: WhereCondition, value: WhereValue): IBuilder;
  havingRaw(raw: string): IBuilder;
  limit(count: number, offset?: number): IBuilder;
  select(columns: string[]): IBuilder;
  selectRaw(column: string): IBuilder;
  get<T extends object>(columns?: string[]): Promise<T[]>;
  first<T extends object>(columns?: string[]): Promise<T | null>;

  // Joins.
  join(table: string, columnA: string, condition: WhereCondition, columnB: string): IBuilder;
  join(table: string, join: JoinCallable): IBuilder;
  innerJoin(table: string, columnA: string, condition: WhereCondition, columnB: string): IBuilder;
  innerJoin(table: string, join: JoinCallable): IBuilder;
  leftJoin(table: string, columnA: string, condition: WhereCondition, columnB: string): IBuilder;
  leftJoin(table: string, join: JoinCallable): IBuilder;
  rightJoin(table: string, columnA: string, condition: WhereCondition, columnB: string): IBuilder;
  rightJoin(table: string, join: JoinCallable): IBuilder;
  crossJoin(table: string): IBuilder;

  // Insert.
  insert<T extends Record<string, WhereValue>>(data: T[]): Promise<void>;
  insertGetId<T extends Record<string, WhereValue>>(data: T): Promise<number>;

  // Delete.
  delete(): Promise<void>;

  // Update.
  update<T extends Record<string, WhereValue>>(values: T): Promise<void>;

  // Aggregates.
  count(column?: string): Promise<number>;
  max(column: string): Promise<number>;
  min(column: string): Promise<number>;
  avg(column: string): Promise<number>;
  sum(column: string): Promise<number>;
}
