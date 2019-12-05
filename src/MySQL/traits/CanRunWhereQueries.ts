import { WhereCondition, WhereValue, IWhereBuilder } from '../../contracts/IBuilder';
import { escapeColumn, escapeValue, escapeValues } from '../../escape';
import { IRaw } from '../../contracts/IRaw';
import { WhereClause } from '../contracts/Types';

export abstract class CanRunWhereQueries<T> implements IWhereBuilder<T> {
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
  public where(column: string, condition: WhereCondition, value: WhereValue): T {
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
  public orWhere(column: string, condition: WhereCondition, value: WhereValue): T {
    if (value === null) {
      return this.whereNull(column);
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
  public whereIn(column: string, values: WhereValue[]): T {
    return this.whereRaw(`${escapeColumn(column)} IN (${escapeValues(values).join(',')})`);
  }

  /**
   * Add a "or where in" clause to the query.
   * @param column The name of the column.
   * @param values The values to evaluate the column against.
   */
  public orWhereIn(column: string, values: WhereValue[]): T {
    return this.orWhereRaw(`${escapeColumn(column)} IN (${escapeValues(values).join(',')})`);
  }

  /**
   * Add a "where not in" clause to the query.
   * @param column The name of the column.
   * @param values The values to evaluate the column against.
   */
  public whereNotIn(column: string, values: WhereValue[]): T {
    return this.whereRaw(`${escapeColumn(column)} NOT IN (${escapeValues(values).join(',')})`);
  }

  /**
   * Add a "or where not in" clause to the query.
   * @param column The name of the column.
   * @param values The values to evaluate the column against.
   */
  public orWhereNotIn(column: string, values: WhereValue[]): T {
    return this.orWhereRaw(`${escapeColumn(column)} NOT IN (${escapeValues(values).join(',')})`);
  }

  /**
   * Add a "where between" clause to the query.
   * @param column The column to evaluate.
   * @param from The lowest value in the range.
   * @param to The highest value in the range.
   */
  public whereBetween(column: string, from: WhereValue, to: WhereValue): T {
    return this.whereRaw(`${escapeColumn(column)} BETWEEN ${escapeValue(from)} AND ${escapeValue(to)}`);
  }

  /**
   * Add a "or where between" clause to the query.
   * @param column The column to evaluate.
   * @param from The lowest value in the range.
   * @param to The highest value in the range.
   */
  public orWhereBetween(column: string, from: WhereValue, to: WhereValue): T {
    return this.orWhereRaw(`${escapeColumn(column)} BETWEEN ${escapeValue(from)} AND ${escapeValue(to)}`);
  }

  /**
   * Add a "where not between" clause to the query.
   * @param column The column to evaluate.
   * @param from The lowest value in the range.
   * @param to The highest value in the range.
   */
  public whereNotBetween(column: string, from: WhereValue, to: WhereValue): T {
    return this.whereRaw(`${escapeColumn(column)} NOT BETWEEN ${escapeValue(from)} AND ${escapeValue(to)}`);
  }

  /**
   * Add a "or where not between" clause to the query.
   * @param column The column to evaluate.
   * @param from The lowest value in the range.
   * @param to The highest value in the range.
   */
  public orWhereNotBetween(column: string, from: WhereValue, to: WhereValue): T {
    return this.orWhereRaw(`${escapeColumn(column)} NOT BETWEEN ${escapeValue(from)} AND ${escapeValue(to)}`);
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
   */
  public whereRaw(raw: string): T {
    this.wheres.push({
      getStatement: (): string => `AND ${raw}`,
    });

    return (this as unknown) as T;
  }

  /**
   * Add a raw or where clause to the query.
   * @param raw The raw condition string.
   */
  public orWhereRaw(raw: string): T {
    this.wheres.push({
      getStatement: (): string => `OR ${raw}`,
    });

    return (this as unknown) as T;
  }

  protected buildWhere(): string {
    if (this.wheres.length === 0) {
      return '';
    }

    let sql = ' ';

    this.wheres.forEach((where, index) => {
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
      } else {
        sql += index === 0 ? '' : where.join || 'AND';
        sql += ` ${escapeColumn(where.column)} ${where.condition} ${escapeValue(where.value)} `;
      }
    });

    return `${sql}`;
  }
}
