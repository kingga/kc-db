import { IRaw } from '../../contracts/IRaw';
import { IWhereBuilder } from '../../contracts/IWhereBuilder';
import { escapeColumn } from '../../escape';
import { BindedQuery, ConditionType, ValueType, WhereClause } from '../../types';
import { SubQueryArg, IBuilder } from '../../contracts/IBuilder';
import { Database } from '../../Database';
import { MySQLBuilder } from '../MySQLBuilder';
import { IJoinBuilder } from '../../contracts/IJoinBuilder';
import { IDatabase } from '../../contracts/IDatabase';
import { IConfig, NonPersistentConfig } from '@kingga/kc-config';
import Container from '@kingga/kc-container';

export abstract class CanRunWhereQueries<T extends IBuilder | IJoinBuilder> implements IWhereBuilder<T> {
  protected wheres: (WhereClause | IRaw)[];

  public constructor() {
    this.wheres = [];
  }

  /**
   * Add a basic where clause to the query.
   * @param column The name of the column.
   * @param condition The type of condition to evaluate.
   * @param value The value to evaluate the column against.
   */
  public where(column: string, condition: ConditionType, value: ValueType): T {
    if (value === null) {
      return this.whereNull(column);
    }

    this.wheres.push({ column, condition, value });

    return (this as unknown) as T;
  }

  /**
   * Add an "or where" clause to the query.
   * @param column The name of the column.
   * @param condition The type of condition to evaluate.
   * @param value The value to evaluate the column against.
   */
  public orWhere(column: string, condition: ConditionType, value: ValueType): T {
    if (value === null) {
      return this.orWhereNull(column);
    }

    this.wheres.push({ column, condition, value, join: 'OR' });

    return (this as unknown) as T;
  }

  /**
   * Add a "where null" clause to the query.
   * @param column The name of the column.
   */
  public whereNull(column: string): T {
    return this.whereRaw(`${escapeColumn(column)} IS NULL`);
  }

  /**
   * Add an "or where null" clause to the query.
   * @param column The name of the column.
   */
  public orWhereNull(column: string): T {
    return this.orWhereRaw(`${escapeColumn(column)} IS NULL`);
  }

  /**
   * Add a "where not null" clause to the query.
   * @param column The name of the column.
   */
  public whereNotNull(column: string): T {
    return this.whereRaw(`${escapeColumn(column)} IS NOT NULL`);
  }

  /**
   * Add an "or where not null" clause to the query.
   * @param column The name of the column.
   */
  public orWhereNotNull(column: string): T {
    return this.orWhereRaw(`${escapeColumn(column)} IS NOT NULL`);
  }

  /**
   * Add a "where in" clause to the query.
   * @param column The name of the column.
   * @param values The values to evaluate the column against.
   */
  public whereIn(column: string, values: ValueType[]): T {
    return this.whereRaw(
      `${escapeColumn(column)} IN (${Array(values.length).fill('?').join(', ')})`,
      values
    );
  }

  /**
   * Add a "or where in" clause to the query.
   * @param column The name of the column.
   * @param values The values to evaluate the column against.
   */
  public orWhereIn(column: string, values: ValueType[]): T {
    return this.orWhereRaw(
      `${escapeColumn(column)} IN (${Array(values.length).fill('?').join(', ')})`,
      values
    );
  }

  /**
   * Add a "where not in" clause to the query.
   * @param column The name of the column.
   * @param values The values to evaluate the column against.
   */
  public whereNotIn(column: string, values: ValueType[]): T {
    return this.whereRaw(
      `${escapeColumn(column)} NOT IN (${Array(values.length).fill('?').join(', ')})`,
      values
    );
  }

  /**
   * Add a "or where not in" clause to the query.
   * @param column The name of the column.
   * @param values The values to evaluate the column against.
   */
  public orWhereNotIn(column: string, values: ValueType[]): T {
    return this.orWhereRaw(
      `${escapeColumn(column)} NOT IN (${Array(values.length).fill('?').join(', ')})`,
      values
    );
  }

  /**
   * Add a "where between" clause to the query.
   * @param column The column to evaluate.
   * @param from The lowest value in the range.
   * @param to The highest value in the range.
   */
  public whereBetween(column: string, from: ValueType, to: ValueType): T {
    return this.whereRaw(
      `${escapeColumn(column)} BETWEEN ? AND ?`,
      [from, to]
    );
  }

  /**
   * Add a "or where between" clause to the query.
   * @param column The column to evaluate.
   * @param from The lowest value in the range.
   * @param to The highest value in the range.
   */
  public orWhereBetween(column: string, from: ValueType, to: ValueType): T {
    return this.orWhereRaw(
      `${escapeColumn(column)} BETWEEN ? AND ?`,
      [from, to]
    );
  }

  /**
   * Add a "where not between" clause to the query.
   * @param column The column to evaluate.
   * @param from The lowest value in the range.
   * @param to The highest value in the range.
   */
  public whereNotBetween(column: string, from: ValueType, to: ValueType): T {
    return this.whereRaw(
      `${escapeColumn(column)} NOT BETWEEN ? AND ?`,
      [from, to]
    );
  }

  /**
   * Add a "or where not between" clause to the query.
   * @param column The column to evaluate.
   * @param from The lowest value in the range.
   * @param to The highest value in the range.
   */
  public orWhereNotBetween(column: string, from: ValueType, to: ValueType): T {
    return this.orWhereRaw(
      `${escapeColumn(column)} NOT BETWEEN ? AND ?`,
      [from, to]
    );
  }

  /**
   * Add a "where like" clause to the query.
   * @param column The column to evaluate.
   * @param value The value to evaluate against.
   */
  public whereLike(column: string, value: string): T {
    this.wheres.push({ column, condition: 'LIKE', value });

    return (this as unknown) as T;
  }

  /**
   * Add a "or where like" clause to the query.
   * @param column The column to evaluate.
   * @param value The value to evaluate against.
   */
  public orWhereLike(column: string, value: string): T {
    this.wheres.push({ column, condition: 'LIKE', value, join: 'OR' });

    return (this as unknown) as T;
  }

  /**
   * Add a "where not like" clause to the query.
   * @param column The column to evaluate.
   * @param value The value to evaluate against.
   */
  public whereNotLike(column: string, value: string): T {
    this.wheres.push({ column, condition: 'NOT LIKE', value });

    return (this as unknown) as T;
  }

  /**
   * Add a "or where not like" clause to the query.
   * @param column The column to evaluate.
   * @param value The value to evaluate against.
   */
  public orWhereNotLike(column: string, value: string): T {
    this.wheres.push({ column, condition: 'NOT LIKE', value, join: 'OR' });

    return (this as unknown) as T;
  }

  /**
   * Add a raw where clause to the query.
   * @param raw The raw condition string.
   * @param bindings The bindings if there are any.
   */
  public whereRaw(raw: string, bindings?: ValueType[]): T {
    this.wheres.push({
      getStatement: (): string => `AND ${raw}`,
      bindings,
    });

    return (this as unknown) as T;
  }

  /**
   * Add a raw or where clause to the query.
   * @param raw The raw condition string.
   * @param bindings The bindings if there are any.
   */
  public orWhereRaw(raw: string, bindings?: ValueType[]): T {
    this.wheres.push({
      getStatement: (): string => `OR ${raw}`,
      bindings,
    });

    return (this as unknown) as T;
  }

  public whereSub(builder: SubQueryArg): T {
    const stmt = this.buildSubQuery(builder);

    this.wheres.push({
      getStatement: () => `(${stmt.getStatement()})`,
      bindings: stmt.bindings,
    });

    return (this as unknown) as T;
  }

  public whereInSub(column: string, builder: SubQueryArg): T {
    const stmt = this.buildSubQuery(builder);

    this.wheres.push({
      getStatement: () => `${escapeColumn(column)} IN (${stmt.getStatement()})`,
      bindings: stmt.bindings,
    });

    return (this as unknown) as T;
  }

  protected buildSubQuery(builder: SubQueryArg): IRaw {
    let stmt: IRaw;

    if (typeof builder === 'function') {
      const config: IConfig = new NonPersistentConfig({ db: {} }, new Container());
      const query = builder(new Database(config, MySQLBuilder));

      stmt = query.getStatement();
    } else if ('getStatement' in builder && 'bindings' in builder) {
      stmt = builder;
    } else {
      stmt = (builder as IBuilder).getStatement();
    }

    return stmt;
  }

  protected buildWhere(): BindedQuery {
    if (this.wheres.length === 0) {
      return { sql: '', bindings: [] };
    }

    let sql = '';
    let bindings: ValueType[] = [];

    this.wheres.forEach((where, index) => {
      sql += ' ';

      if ('getStatement' in where) {
        // If this is the first where clause, remove the AND/OR from the beginning if it exists.
        let stmt = where.getStatement().trim();

        if (index === 0) {
          const uppercase = stmt.toUpperCase();

          if (uppercase.startsWith('AND ') || uppercase.startsWith('OR ')) {
            // Search for 'AND' or 'OR' up to the next word seperated by whitespace.
            stmt = stmt.replace(/^AND(?!\S)|OR(?!\S)/i, '').trim();
          }
        }

        sql += stmt;

        // Append the bindings.
        if (where.bindings) {
            bindings = [...bindings, ...where.bindings];
        }
      } else {
        sql += index === 0 ? '' : where.join || 'AND';
        sql += ` ${escapeColumn(where.column)} ${where.condition} ? `;
        bindings.push(where.value);
      }
    });

    return { sql, bindings };
  }
}
