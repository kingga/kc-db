import { ConditionType, ValueType } from '../types';
import { SubQueryArg } from './IBuilder';
import { IDate } from './IDate';
import { IDatabase } from './IDatabase';

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

  // Sub queries.
  whereSub(builder: SubQueryArg, db?: IDatabase): T;
  whereInSub(column: string, builder: SubQueryArg, db?: IDatabase): T;

  // // JSON.
  // whereJsonContains(column: string, value: ValueType): T;
  // orWhereJsonContains(column: string, value: ValueType): T;
  // whereJsonDoesntContain(column: string, value: ValueType): T;
  // orWhereJsonDoesntContain(column: string, value: ValueType): T;
  // whereJsonLength(column: string, operator: ConditionType, value: ValueType): T;
  // orWhereJsonLength(column: string, operator: ConditionType, value: ValueType): T;

  // // Date.
  // whereDate(column: string, date: IDate | string): T;
  // orWhereDate(column: string, date: IDate | string): T;
  // whereTime(column: string, time: IDate | string): T;
  // orWhereTime(column: string, time: IDate | string): T;
  // whereDay(column: string, day: IDate | string): T;
  // orWhereDay(column: string, day: IDate | string): T;
  // whereMonth(column: string, month: IDate | string): T;
  // orWhereMonth(column: string, month: IDate | string): T;
  // whereYear(column: string, year: IDate | string): T;
  // orWhereYear(column: string, year: IDate | string): T;
}
