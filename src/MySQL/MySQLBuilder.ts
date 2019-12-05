import { IBuilder, WhereCondition, WhereValue, OrderDirection, JoinCallable } from '../contracts/IBuilder';
import { IRaw } from '../contracts/IRaw';
import * as mysql from 'mysql';
import { escapeValue, escapeColumn, escapeTable } from '../escape';
import { IJoin, JoinType } from './contracts/IJoin';
import { Join } from './joins/Join';
import { CrossJoin } from './joins/CrossJoin';
import { CanRunWhereQueries } from './traits/CanRunWhereQueries';
import { IConfig } from '@kingga/kc-config';
import { InternalQueryReturnType, AggregatedResult } from './contracts/ReturnTypes';
import { OrderBy, Limit, HavingClause } from './contracts/Types';

export class MySQLBuilder extends CanRunWhereQueries<IBuilder> implements IBuilder {
  protected config: IConfig;
  protected baseTable: string;
  protected isDistinct: boolean;
  protected groups: string[];
  protected orders: OrderBy[];
  protected resultLimit: Limit | null;
  protected havings: (HavingClause | IRaw)[];
  protected selectedColumns: string[];
  protected joins: IJoin[];

  public constructor(config: IConfig) {
    if (!config.get('db')) {
      throw new Error("The database configuration has not been loaded, please use the tag 'db'.");
    }

    super();
    this.config = config;
    this.baseTable = '';
    this.isDistinct = false;
    this.groups = [];
    this.orders = [];
    this.resultLimit = null;
    this.havings = [];
    this.selectedColumns = [];
    this.joins = [];
  }

  public table(table: string): IBuilder {
    this.baseTable = table;

    return this;
  }

  public internalQuery<T>(query: string): Promise<InternalQueryReturnType<T>> {
    console.log({ query });

    return new Promise((resolve, reject) => {
      const connection = mysql.createConnection({
        host: this.config.get('db.host'),
        user: this.config.get('db.user'),
        password: this.config.get('db.password'),
        database: this.config.get('db.database'),
        port: this.config.get('db.port', 3306),
      });

      connection.connect({}, (error) => {
        if (error) {
          reject(error);
        }
      });

      connection.query(query, (error, results, fields) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({ results, fields });
      });

      connection.end();
    });
  }

  public query<T>(query: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.internalQuery<T>(query)
        .then(({ results }) => resolve(results))
        .catch((error: mysql.MysqlError) => reject(error));
    });
  }

  public distinct(): IBuilder {
    this.isDistinct = true;

    return this;
  }

  public groupBy(column: string): IBuilder {
    this.groups.push(column);

    return this;
  }

  public orderBy(column: string, direction: OrderDirection): IBuilder {
    this.orders.push({ column, direction });

    return this;
  }

  public having(column: string, condition: WhereCondition, value: WhereValue): IBuilder {
    this.havings.push({ column, condition, value });

    return this;
  }

  public havingRaw(raw: string): IBuilder {
    this.havings.push({
      getStatement: (): string => raw,
    });

    return this;
  }

  public limit(count: number, offset?: number): IBuilder {
    this.resultLimit = { count, offset: offset || 0 };

    return this;
  }

  public select(columns: string[] | string): IBuilder {
    if (typeof columns === 'string') {
      this.selectRaw(escapeColumn(columns));
    } else {
      this.selectedColumns = columns.map((column) => escapeColumn(column));
    }

    return this;
  }

  public selectRaw(column: string): IBuilder {
    this.selectedColumns.push(column);

    return this;
  }

  public join(table: string, columnA: string | JoinCallable, condition?: WhereCondition, columnB?: string): IBuilder {
    return this.innerJoin(table, columnA, condition, columnB);
  }

  public innerJoin(
    table: string,
    columnA: string | JoinCallable,
    condition?: WhereCondition,
    columnB?: string,
  ): IBuilder {
    return this.createJoin('INNER', table, columnA, condition, columnB);
  }

  public leftJoin(
    table: string,
    columnA: string | JoinCallable,
    condition?: WhereCondition,
    columnB?: string,
  ): IBuilder {
    return this.createJoin('LEFT', table, columnA, condition, columnB);
  }

  public rightJoin(
    table: string,
    columnA: string | JoinCallable,
    condition?: WhereCondition,
    columnB?: string,
  ): IBuilder {
    return this.createJoin('RIGHT', table, columnA, condition, columnB);
  }

  protected createJoin(
    type: JoinType,
    table: string,
    columnA: string | JoinCallable,
    condition?: WhereCondition,
    columnB?: string,
  ): IBuilder {
    if (typeof columnA === 'string' && typeof condition === 'string' && typeof columnB === 'string') {
      this.joins.push(new Join({ type, table, columnA, condition, columnB }));
    } else if (typeof columnA === 'function') {
      this.joins.push(new Join({ type, table, join: columnA }));
    }

    return this;
  }

  public crossJoin(table: string): IBuilder {
    this.joins.push(new CrossJoin(table));

    return this;
  }

  public get<T extends object>(columns?: string[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (columns && columns.length) {
        this.select(columns);
      }

      let sql = this.buildSelects();
      sql += this.buildConditionQuery();
      sql += this.buildOrder();
      sql += this.buildLimit();

      if (sql.trim()) {
        return this.internalQuery<T[]>(sql.trim())
          .then(({ results }) => resolve(results))
          .catch((error) => reject(error));
      } else {
        resolve();
      }
    });
  }

  public first<T extends object>(columns?: string[]): Promise<T | null> {
    this.limit(1);

    return new Promise((resolve, reject) => {
      this.get<T>(columns)
        .then((results) => resolve(results[0] || null))
        .catch((error) => reject(error));
    });
  }

  public insert<T extends Record<string, WhereValue>>(data: T[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use these to decide when all of the inserts have finished.
      const len = data.length;
      let ctr = 0;

      data.forEach((insert) => {
        this.insertGetId<T>(insert)
          .then(() => {
            ctr++;

            if (ctr === len) {
              resolve();
            }
          })
          .catch((error) => reject(error));
      });
    });
  }

  public insertGetId<T extends Record<string, WhereValue>>(data: T): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.baseTable) {
        return reject('The table is not set.');
      }

      const columns = Object.keys(data).map((c) => escapeColumn(c));
      const values = Object.values(data).map((v) => escapeValue(v));

      let sql = `INSERT INTO ${this.baseTable} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
      sql += this.buildConditionQuery();

      this.internalQuery<{ insertId: number }>(sql)
        .then(({ results }) => resolve(results.insertId))
        .catch((error) => reject(error));
    });
  }

  public delete(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.baseTable) {
        return reject('The table is not set.');
      }

      this.query(`DELETE ${this.buildConditionQuery()}`)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  public update<T extends Record<string, WhereValue>>(values: T): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.baseTable) {
        return reject('The table is not set.');
      }

      let sql = `UPDATE ${this.baseTable} SET `;
      let first = true;

      for (const [k, v] of Object.entries(values)) {
        if (!first) {
          sql += ' AND ';
        }

        sql += `${escapeColumn(k)} = ${escapeValue(v)}`;
        first = false;
      }

      sql += this.buildConditionQuery();

      this.query(sql)
        .then(() => resolve())
        .catch((error) => reject(error));
    });
  }

  public count(column?: string): Promise<number> {
    return this.queryAggregate<number>('COUNT', 0, column);
  }

  public min(column: string): Promise<number> {
    return this.queryAggregate<number>('MIN', 0, column);
  }

  public max(column: string): Promise<number> {
    return this.queryAggregate<number>('MAX', 0, column);
  }

  public avg(column: string): Promise<number> {
    return this.queryAggregate<number>('AVG', 0, column);
  }

  public sum(column: string): Promise<number> {
    return this.queryAggregate<number>('SUM', 0, column);
  }

  protected queryAggregate<T>(func: string, defaultValue: T, column?: string): Promise<T> {
    this.selectRaw(`${func.toUpperCase()}(${column ? escapeColumn(column) : '*'}) AS aggregate`);

    return new Promise((resolve, reject) => {
      this.first<AggregatedResult<T>>()
        .then((result) => resolve(result ? result.aggregate : defaultValue))
        .catch((error) => reject(error));
    });
  }

  protected buildTable(): string {
    return ` FROM ${escapeTable(this.baseTable)} `;
  }

  protected buildWhere(): string {
    if (this.wheres.length === 0) {
      return '';
    }

    return ` WHERE ${super.buildWhere()}`;
  }

  protected buildGroups(): string {
    if (this.groups.length) {
      return ' GROUP BY ' + this.groups.join(', ') + ' ';
    }

    return '';
  }

  protected buildOrder(): string {
    if (this.orders.length === 0) {
      return '';
    }

    let sql = ' ORDER BY ';
    const orders = this.orders.map((order) => `${order.column} ${order.direction}`);
    sql += orders.join(', ');

    return `${sql} `;
  }

  protected buildLimit(): string {
    if (!this.resultLimit) {
      return '';
    }

    const { count, offset } = this.resultLimit;

    return ` LIMIT ${count} OFFSET ${offset} `;
  }

  protected buildHavings(): string {
    if (this.havings.length === 0) {
      return '';
    }

    let sql = ' HAVING ';

    this.havings.forEach((having, index) => {
      if ('getStatement' in having) {
        sql += having.getStatement();
      } else {
        sql += index === 0 ? '' : 'AND ';
        sql += ` ${having.column} ${having.condition} ${having.value} `;
      }
    });

    return sql;
  }

  protected buildJoins(): string {
    return this.joins.map((join) => join.toSql()).join(' ');
  }

  protected buildSelects(): string {
    const sql = `SELECT ${this.isDistinct ? 'DISTINCT' : ''} `;

    if (this.selectedColumns.length === 0) {
      return `${sql} * `;
    }

    return `${sql} ${this.selectedColumns.join(', ')} `;
  }

  protected buildConditionQuery(): string {
    let sql = this.buildTable();
    sql += this.buildJoins();
    sql += this.buildWhere();
    sql += this.buildGroups();
    sql += this.buildHavings();

    return sql;
  }
}
