import { WhereCondition, WhereValue, OrderDirection } from '../../contracts/IBuilder';

export type WhereJoin = 'AND' | 'OR';

export interface WhereClause {
  column: string;
  condition: WhereCondition;
  value: WhereValue;
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
  condition: WhereCondition;
  value: WhereValue;
}
