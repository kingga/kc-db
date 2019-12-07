import { ConditionType, ValueType } from '../types';

export interface IWhereBuilder<T> {
  where(column: string, condition: ConditionType, value: ValueType): T;
  whereNull(column: string): T;
  whereNotNull(column: string): T;
  whereIn(column: string, values: ValueType[]): T;
  whereNotIn(column: string, values: ValueType[]): T;
  whereBetween(column: string, from: ValueType, to: ValueType): T;
  whereNotBetween(column: string, from: ValueType, to: ValueType): T;
  whereLike(column: string, value: string): T;
  whereNotLike(column: string, value: string): T;
  orWhere(column: string, condition: ConditionType, value: ValueType): T;
  orWhereNull(column: string): T;
  orWhereNotNull(column: string): T;
  orWhereIn(column: string, values: ValueType[]): T;
  orWhereNotIn(column: string, values: ValueType[]): T;
  orWhereBetween(column: string, from: ValueType, to: ValueType): T;
  orWhereNotBetween(column: string, from: ValueType, to: ValueType): T;
  orWhereLike(column: string, value: string): T;
  orWhereNotLike(column: string, value: string): T;
  whereRaw(raw: string, bindings?: ValueType[]): T;
  orWhereRaw(raw: string, bindings?: ValueType[]): T;
}
