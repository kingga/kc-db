import { ConditionType, ValueTypes, OrderDirection } from '../../contracts/IBuilder';

export type WhereJoin = 'AND' | 'OR';

export interface WhereClause {
  column: string;
  condition: ConditionType;
  value: ValueTypes;
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
  value: ValueTypes;
}
