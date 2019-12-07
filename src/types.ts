import { FieldPacket } from 'mysql2/promise';

import { IBuilder } from './contracts/IBuilder';
import { IDatabase } from './contracts/IDatabase';
import { IJoinBuilder } from './contracts/IJoinBuilder';

export type ConditionType = '=' | '<=>' | '>' | '>=' | '<' | '<=' | 'LIKE' | 'NOT LIKE' | '!=' | '<>';
export type ValueType = string | number | null;
export type OrderDirection = 'DESC' | 'ASC';
export type JoinCallable = (join: IJoinBuilder) => void;
export type BuilderConstructor = new (db: IDatabase) => IBuilder;
export type WhereJoin = 'AND' | 'OR';

export interface BindedQuery {
  sql: string;
  bindings: ValueType[];
}

export interface InternalQueryReturnType<T> {
  results: T;
  fields?: FieldPacket[];
}

export interface AggregatedResult<T> {
  aggregate: T;
}

export interface WhereClause {
  column: string;
  condition: ConditionType;
  value: ValueType;
  join?: WhereJoin;
}

export interface OrderBy {
  column: string;
  direction: OrderDirection;
}

export interface Limit {
  count: number;
  offset: number;
}

export interface HavingClause {
  column: string;
  condition: ConditionType;
  value: ValueType;
}
