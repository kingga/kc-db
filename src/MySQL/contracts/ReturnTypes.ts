import { FieldPacket } from 'mysql2/promise';

export interface InternalQueryReturnType<T> {
  results: T;
  fields?: FieldPacket[];
}

export interface AggregatedResult<T> {
  aggregate: T;
}
