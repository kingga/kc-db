"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = require("../escape");
const CrossJoin_1 = require("./joins/CrossJoin");
const Join_1 = require("./joins/Join");
const CanRunWhereQueries_1 = require("./traits/CanRunWhereQueries");
const vsprintf_1 = __importDefault(require("locutus/php/strings/vsprintf"));
class MySQLBuilder extends CanRunWhereQueries_1.CanRunWhereQueries {
    constructor(db) {
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
        this.tableNotSet = 'The table is not set.';
    }
    table(table) {
        this.baseTable = escape_1.escapeTable(table);
        return this;
    }
    distinct() {
        this.isDistinct = true;
        return this;
    }
    groupBy(column) {
        this.groups.push(column);
        return this;
    }
    orderBy(column, direction) {
        this.orders.push({ column, direction });
        return this;
    }
    having(column, condition, value) {
        this.havings.push({ column, condition, value });
        return this;
    }
    havingRaw(raw) {
        this.havings.push({
            getStatement: () => raw,
        });
        return this;
    }
    limit(count, offset) {
        this.resultLimit = { count, offset: offset || 0 };
        return this;
    }
    select(columns) {
        if (typeof columns === 'string') {
            this.selectRaw(escape_1.escapeColumn(columns));
        }
        else {
            this.selectedColumns = columns.map((column) => escape_1.escapeColumn(column));
        }
        return this;
    }
    selectRaw(column) {
        this.selectedColumns.push(column);
        return this;
    }
    join(table, columnA, condition, columnB) {
        return this.innerJoin(table, columnA, condition, columnB);
    }
    innerJoin(table, columnA, condition, columnB) {
        return this.createJoin('INNER', table, columnA, condition, columnB);
    }
    leftJoin(table, columnA, condition, columnB) {
        return this.createJoin('LEFT', table, columnA, condition, columnB);
    }
    rightJoin(table, columnA, condition, columnB) {
        return this.createJoin('RIGHT', table, columnA, condition, columnB);
    }
    createJoin(type, table, columnA, condition, columnB) {
        if (typeof columnA === 'string' && typeof condition === 'string' && typeof columnB === 'string') {
            this.joins.push(new Join_1.Join({ type, table, columnA, condition, columnB }));
        }
        else if (typeof columnA === 'function') {
            this.joins.push(new Join_1.Join({ type, table, join: columnA }));
        }
        return this;
    }
    crossJoin(table) {
        this.joins.push(new CrossJoin_1.CrossJoin(table));
        return this;
    }
    async get(columns) {
        if (columns && columns.length) {
            this.select(columns);
        }
        const query = this.getStatement();
        return await this.db.query(query.getStatement(), query.bindings) || [];
    }
    async first(columns) {
        this.limit(1);
        const results = await this.get(columns);
        return results ? results[0] || null : null;
    }
    async insertGetId(data) {
        if (!this.baseTable) {
            throw this.tableNotSet;
        }
        const columns = Object.keys(data).map((c) => escape_1.escapeColumn(c));
        const sql = `INSERT INTO ${this.baseTable} (${columns.join(', ')}) VALUES (${Array(columns.length).fill('?').join(', ')})`;
        const bindings = Object.values(data);
        const results = await this.db.query(sql, bindings);
        return results && results[0] ? results[0].insertId : -1;
    }
    async insert(data) {
        for (const insert of data) {
            await this.insertGetId(insert);
        }
    }
    async delete() {
        if (!this.baseTable) {
            throw this.tableNotSet;
        }
        let sql = `DELETE FROM ${this.baseTable} `;
        let bindings = [];
        const conditions = this.buildConditionQuery();
        sql += conditions.sql;
        bindings = [...bindings, ...conditions.bindings];
        await this.db.query(sql, bindings);
    }
    async update(values) {
        if (!this.baseTable) {
            throw this.tableNotSet;
        }
        let sql = `UPDATE ${this.baseTable} SET `;
        let bindings = [];
        let first = true;
        for (const [k, v] of Object.entries(values)) {
            if (!first) {
                sql += ' AND ';
            }
            sql += `${escape_1.escapeColumn(k)} = ?`;
            bindings.push(v);
            first = false;
        }
        const conditions = this.buildConditionQuery();
        sql += conditions.sql;
        bindings = [...bindings, ...conditions.bindings];
        await this.db.query(sql, bindings);
    }
    count(column) {
        return this.queryAggregate('COUNT', 0, column);
    }
    min(column) {
        return this.queryAggregate('MIN', 0, column);
    }
    max(column) {
        return this.queryAggregate('MAX', 0, column);
    }
    avg(column) {
        return this.queryAggregate('AVG', 0, column);
    }
    sum(column) {
        return this.queryAggregate('SUM', 0, column);
    }
    getBindings() {
        return [
            ...this.buildJoins().bindings,
            ...this.buildConditionQuery().bindings,
            ...this.buildLimit().bindings,
        ];
    }
    getStatement() {
        let sql = '';
        const joins = this.buildJoins();
        const conditions = this.buildConditionQuery();
        const limit = this.buildLimit();
        sql += this.buildSelects();
        sql += this.buildTable();
        sql += joins.sql;
        sql += conditions.sql;
        sql += this.buildOrder();
        sql += limit.sql;
        return {
            getStatement: () => sql,
            bindings: this.getBindings(),
        };
    }
    toSql() {
        const stmt = this.getStatement();
        const sql = stmt.getStatement()
            .replace(/\s{2,}/g, ' ')
            .replace(/\?/g, "'%s'");
        return vsprintf_1.default(sql, (stmt.bindings || [])).trim();
    }
    async queryAggregate(func, defaultValue, column) {
        this.selectRaw(`${func.toUpperCase()}(${column ? escape_1.escapeColumn(column) : '*'}) AS aggregate`);
        const result = await this.first();
        return result ? parseFloat(result.aggregate) : defaultValue;
    }
    buildTable() {
        return ` FROM ${this.baseTable} `;
    }
    buildWhere() {
        if (this.wheres.length === 0) {
            return { sql: '', bindings: [] };
        }
        const { sql, bindings } = super.buildWhere();
        return {
            sql: `WHERE ${sql}`,
            bindings,
        };
    }
    buildGroups() {
        if (this.groups.length) {
            return ' GROUP BY ' + this.groups.join(', ') + ' ';
        }
        return '';
    }
    buildOrder() {
        if (this.orders.length === 0) {
            return '';
        }
        let sql = ' ORDER BY ';
        const orders = this.orders.map((order) => `${order.column} ${order.direction}`);
        sql += orders.join(', ');
        return `${sql} `;
    }
    buildLimit() {
        if (!this.resultLimit) {
            return { sql: '', bindings: [] };
        }
        const { count, offset } = this.resultLimit;
        return {
            sql: ` LIMIT ? OFFSET ?`,
            bindings: [count, offset],
        };
    }
    buildHavings() {
        if (this.havings.length === 0) {
            return { sql: '', bindings: [] };
        }
        let sql = 'HAVING ';
        const bindings = [];
        this.havings.forEach((having, index) => {
            if ('getStatement' in having) {
                sql += having.getStatement();
            }
            else {
                sql += index === 0 ? '' : 'AND ';
                sql += ` ${escape_1.escapeColumn(having.column)} ${having.condition} ? `;
                bindings.push(having.value);
            }
        });
        return {
            sql: sql.trim(),
            bindings,
        };
    }
    buildJoins() {
        let sql = '';
        let bindings = [];
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
    buildSelects() {
        const sql = `SELECT ${this.isDistinct ? 'DISTINCT' : ''} `;
        if (this.selectedColumns.length === 0) {
            return `${sql} * `;
        }
        return `${sql} ${this.selectedColumns.join(', ')} `;
    }
    buildConditionQuery() {
        const query = { sql: '', bindings: [] };
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
exports.MySQLBuilder = MySQLBuilder;
