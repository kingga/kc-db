import { ValueType } from '../types';

export interface IRaw {
  getStatement(): string;
  bindings?: ValueType[];
}
