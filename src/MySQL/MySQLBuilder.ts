import { IBuilder } from '../contracts/IBuilder';
import { IDatabase } from '../contracts/IDatabase';
import { IJoin, JoinType } from '../contracts/IJoin';
import { IRaw } from '../contracts/IRaw';
import { escapeColumn, escapeTable } from '../escape';
import {
  AggregatedResult,
  BindedQuery,
  ConditionType,
  HavingClause,
  JoinCallable,
  Limit,
  OrderBy,
  OrderDirection,
  ValueType,
} from '../types';
import { CrossJoin } from './joins/CrossJoin';
import { Join } from './joins/Join';
import { CanRunWhereQueries } from './traits/CanRunWhereQueries';

export class MySQLBuilder extends CanRunWhereQueries<IBuilder> implements IBuilder {
  protected db: IDatabase;
  protected baseTable: string;
  protected isDistinct: boolean;
  protected groups: string[];
  protected orders: OrderBy[];
  protected resultLimit: Limit | null;
  protected havings: (HavingClause | IRaw)[];
  protected selectedColumns: string[];
  protected joins: IJoin[];

  public constructor(db: IDatabase) {
    super();
    this.baseTable = '';
    this.isDistinct = false;
    this.groups = [];
    this.orders = [];
    this.resultLimit = null;
    this.havings = [];
    this.selectedColumns = [];
    this.joins = [];
    this.db = db;
  }

  public table(table: string): IBuilder {
    this.baseTable = escapeTable(table);

    return this;
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

  public having(column: string, condition: ConditionType, value: ValueType): IBuilder {
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

  public join(table: string, columnA: string | JoinCallable, condition?: ConditionType, columnB?: string): IBuilder {
    return this.innerJoin(table, columnA, condition, columnB);
  }

  public innerJoin(
    table: string,
    columnA: string | JoinCallable,
    condition?: ConditionType,
    columnB?: string,
  ): IBuilder {
    return this.createJoin('INNER', table, columnA, condition, columnB);
  }

  public leftJoin(
    table: string,
    columnA: string | JoinCallable,
    condition?: ConditionType,
    columnB?: string,
  ): IBuilder {
    return this.createJoin('LEFT', table, columnA, condition, columnB);
  }

  public rightJoin(
    table: string,
    columnA: string | JoinCallable,
    condition?: ConditionType,
    columnB?: string,
  ): IBuilder {
    return this.createJoin('RIGHT', table, columnA, condition, columnB);
  }

  protected createJoin(
    type: JoinType,
    table: string,
    columnA: string | JoinCallable,
    condition?: ConditionType,
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

  public async get<T extends object>(columns?: string[]): Promise<T[]> {
    if (columns && columns.length) {
      this.select(columns);
    }

    let sql = '';
    let bindings: ValueType[] = [];

    const joins = this.buildJoins();
    const conditions = this.buildConditionQuery();
    const limit = this.buildLimit();

    sql += this.buildSelects();
    sql += this.buildTable();
    sql += joins.sql;
    bindings = [...bindings, ...joins.bindings];
    sql += conditions.sql;
    bindings = [...bindings, ...conditions.bindings];
    sql += this.buildOrder();
    sql += limit.sql;
    bindings = [...bindings, ...limit.bindings];

    return await this.db.query<T>(sql, bindings) || [];
  }

  public async first<T extends object>(columns?: string[]): Promise<T | null> {
    this.limit(1);
    const results = await this.get<T>(columns);

    return results ? results[0] : null;
  }

  public async insertGetId<T extends Record<string, ValueType>>(data: T): Promise<number> {
    if (!this.baseTable) {
      throw 'The table is not set.';
    }

    const columns = Object.keys(data).map((c) => escapeColumn(c));
    const sql = `INSERT INTO ${this.baseTable} (${columns.join(', ')}) VALUES (${Array(columns.length).fill('?').join(', ')})`;
    const bindings = Object.values(data);

    const results = await this.db.query<{ insertId: number }>(sql, bindings);

    return results ? results[0].insertId : -1;
  }

  public async insert<T extends Record<string, ValueType>>(data: T[]): Promise<void> {
    for (const insert of data) {
      await this.insertGetId<T>(insert);
    }
  }

  public async delete(): Promise<void> {
    if (!this.baseTable) {
      throw 'The table is not set.';
    }

    let sql = `DELETE FROM ${this.baseTable} `;
    let bindings: ValueType[] = [];

    const conditions = this.buildConditionQuery();
    sql += conditions.sql;
    bindings = [...bindings, ...conditions.bindings];

    await this.db.query(sql, bindings);
  }

  public async update<T extends Record<string, ValueType>>(values: T): Promise<void> {
    if (!this.baseTable) {
      throw 'The table is not set.';
    }

    let sql = `UPDATE ${this.baseTable} SET `;
    let bindings: ValueType[] = [];
    let first = true;

    for (const [k, v] of Object.entries(values)) {
      if (!first) {
        sql += ' AND ';
      }

      sql += `${escapeColumn(k)} = ?`;
      bindings.push(v);
      first = false;
    }

    const conditions = this.buildConditionQuery();
    sql += conditions.sql;
    bindings = [...bindings, ...conditions.bindings];

    await this.db.query(sql, bindings);
  }

  public count(column?: string): Promise<number> {
    return this.queryAggregate('COUNT', 0, column);
  }

  public min(column: string): Promise<number> {
    return this.queryAggregate('MIN', 0, column);
  }

  public max(column: string): Promise<number> {
    return this.queryAggregate('MAX', 0, column);
  }

  public avg(column: string): Promise<number> {
    return this.queryAggregate('AVG', 0, column);
  }

  public sum(column: string): Promise<number> {
    return this.queryAggregate('SUM', 0, column);
  }

  protected async queryAggregate(func: string, defaultValue: number, column?: string): Promise<number> {
    this.selectRaw(`${func.toUpperCase()}(${column ? escapeColumn(column) : '*'}) AS aggregate`);
    const result = await this.first<AggregatedResult<string>>();

    return result ? parseFloat(result.aggregate) : defaultValue;
  }

  protected buildTable(): string {
    return ` FROM ${this.baseTable} `;
  }

  protected buildWhere(): BindedQuery {
    if (this.wheres.length === 0) {
      return { sql: '', bindings: [] };
    }

    const { sql, bindings } = super.buildWhere();

    return {
      sql: `WHERE ${sql}`,
      bindings,
    };
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

  protected buildLimit(): BindedQuery {
    if (!this.resultLimit) {
      return { sql: '', bindings: [] };
    }

    const { count, offset } = this.resultLimit;

    return {
      sql: ` LIMIT ? OFFSET ?`,
      bindings: [count, offset],
    };
  }

  protected buildHavings(): BindedQuery {
    if (this.havings.length === 0) {
      return { sql: '', bindings: [] };
    }

    let sql = 'HAVING ';
    const bindings: ValueType[] = [];

    this.havings.forEach((having, index) => {
      if ('getStatement' in having) {
        sql += having.getStatement();
      } else {
        sql += index === 0 ? '' : 'AND ';
        sql += ` ${escapeColumn(having.column)} ${having.condition} ? `;
        bindings.push(having.value);
      }
    });

    return {
      sql: sql.trim(),
      bindings,
    };
  }

  protected buildJoins(): BindedQuery {
    let sql = '';
    let bindings: ValueType[] = [];

    for (const join of this.joins) {
      const query = join.toSql();

      sql += query.sql;
      bindings = [...bindings, ...query.bindings];
    }

    return {
      sql: sql.trim(),
      bindings,
    };
  }

  protected buildSelects(): string {
    const sql = `SELECT ${this.isDistinct ? 'DISTINCT' : ''} `;

    if (this.selectedColumns.length === 0) {
      return `${sql} * `;
    }

    return `${sql} ${this.selectedColumns.join(', ')} `;
  }

  protected buildConditionQuery(): BindedQuery {
    const query: BindedQuery = { sql: '', bindings: [] };
    const where = this.buildWhere();
    const havings = this.buildHavings();

    query.sql += where.sql;
    query.bindings = [...query.bindings, ...where.bindings];
    query.sql += ` ${this.buildGroups()}`;
    query.sql += ` ${havings.sql}`;
    query.bindings = [...query.bindings, ...havings.bindings];

    return query;
  }
}
