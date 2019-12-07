import { BindedQuery, ConditionType } from '../types';
import { IWhereBuilder } from './IWhereBuilder';

export interface IJoinBuilder extends IWhereBuilder<IJoinBuilder> {
  on(columnA: string, condition: ConditionType, columnB: string): IJoinBuilder;
  toSql(): BindedQuery;
}
