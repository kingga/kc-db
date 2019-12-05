import { FieldInfo } from 'mysql';

export interface InternalQueryReturnType<T> {
  results: T;
  fields?: FieldInfo[];
}

export interface AggregatedResult<T> {
  aggregate: T;
}
