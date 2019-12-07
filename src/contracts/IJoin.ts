import { BindedQuery, ConditionType, JoinCallable } from '../types';

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT';

export interface JoinInfo {
  type: JoinType;
  table: string;
  columnA: string;
  condition: ConditionType;
  columnB: string;
}

export interface CallableJoinInfo {
  type: JoinType;
  table: string;
  join: JoinCallable;
}

export interface IJoin {
  toSql(): BindedQuery;
}
