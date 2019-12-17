"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = require("../../escape");
const Database_1 = require("../../Database");
const MySQLBuilder_1 = require("../MySQLBuilder");
const kc_config_1 = require("@kingga/kc-config");
const kc_container_1 = __importDefault(require("@kingga/kc-container"));
class CanRunWhereQueries {
    constructor() {
        this.wheres = [];
    }
    /**
     * Add a basic where clause to the query.
     * @param column The name of the column.
     * @param condition The type of condition to evaluate.
     * @param value The value to evaluate the column against.
     */
    where(column, condition, value) {
        if (value === null) {
            return this.whereNull(column);
        }
        this.wheres.push({ column, condition, value });
        return this;
    }
    /**
     * Add an "or where" clause to the query.
     * @param column The name of the column.
     * @param condition The type of condition to evaluate.
     * @param value The value to evaluate the column against.
     */
    orWhere(column, condition, value) {
        if (value === null) {
            return this.orWhereNull(column);
        }
        this.wheres.push({ column, condition, value, join: 'OR' });
        return this;
    }
    /**
     * Add a "where null" clause to the query.
     * @param column The name of the column.
     */
    whereNull(column) {
        return this.whereRaw(`${escape_1.escapeColumn(column)} IS NULL`);
    }
    /**
     * Add an "or where null" clause to the query.
     * @param column The name of the column.
     */
    orWhereNull(column) {
        return this.orWhereRaw(`${escape_1.escapeColumn(column)} IS NULL`);
    }
    /**
     * Add a "where not null" clause to the query.
     * @param column The name of the column.
     */
    whereNotNull(column) {
        return this.whereRaw(`${escape_1.escapeColumn(column)} IS NOT NULL`);
    }
    /**
     * Add an "or where not null" clause to the query.
     * @param column The name of the column.
     */
    orWhereNotNull(column) {
        return this.orWhereRaw(`${escape_1.escapeColumn(column)} IS NOT NULL`);
    }
    /**
     * Add a "where in" clause to the query.
     * @param column The name of the column.
     * @param values The values to evaluate the column against.
     */
    whereIn(column, values) {
        return this.whereRaw(`${escape_1.escapeColumn(column)} IN (${Array(values.length).fill('?').join(', ')})`, values);
    }
    /**
     * Add a "or where in" clause to the query.
     * @param column The name of the column.
     * @param values The values to evaluate the column against.
     */
    orWhereIn(column, values) {
        return this.orWhereRaw(`${escape_1.escapeColumn(column)} IN (${Array(values.length).fill('?').join(', ')})`, values);
    }
    /**
     * Add a "where not in" clause to the query.
     * @param column The name of the column.
     * @param values The values to evaluate the column against.
     */
    whereNotIn(column, values) {
        return this.whereRaw(`${escape_1.escapeColumn(column)} NOT IN (${Array(values.length).fill('?').join(', ')})`, values);
    }
    /**
     * Add a "or where not in" clause to the query.
     * @param column The name of the column.
     * @param values The values to evaluate the column against.
     */
    orWhereNotIn(column, values) {
        return this.orWhereRaw(`${escape_1.escapeColumn(column)} NOT IN (${Array(values.length).fill('?').join(', ')})`, values);
    }
    /**
     * Add a "where between" clause to the query.
     * @param column The column to evaluate.
     * @param from The lowest value in the range.
     * @param to The highest value in the range.
     */
    whereBetween(column, from, to) {
        return this.whereRaw(`${escape_1.escapeColumn(column)} BETWEEN ? AND ?`, [from, to]);
    }
    /**
     * Add a "or where between" clause to the query.
     * @param column The column to evaluate.
     * @param from The lowest value in the range.
     * @param to The highest value in the range.
     */
    orWhereBetween(column, from, to) {
        return this.orWhereRaw(`${escape_1.escapeColumn(column)} BETWEEN ? AND ?`, [from, to]);
    }
    /**
     * Add a "where not between" clause to the query.
     * @param column The column to evaluate.
     * @param from The lowest value in the range.
     * @param to The highest value in the range.
     */
    whereNotBetween(column, from, to) {
        return this.whereRaw(`${escape_1.escapeColumn(column)} NOT BETWEEN ? AND ?`, [from, to]);
    }
    /**
     * Add a "or where not between" clause to the query.
     * @param column The column to evaluate.
     * @param from The lowest value in the range.
     * @param to The highest value in the range.
     */
    orWhereNotBetween(column, from, to) {
        return this.orWhereRaw(`${escape_1.escapeColumn(column)} NOT BETWEEN ? AND ?`, [from, to]);
    }
    /**
     * Add a "where like" clause to the query.
     * @param column The column to evaluate.
     * @param value The value to evaluate against.
     */
    whereLike(column, value) {
        this.wheres.push({ column, condition: 'LIKE', value });
        return this;
    }
    /**
     * Add a "or where like" clause to the query.
     * @param column The column to evaluate.
     * @param value The value to evaluate against.
     */
    orWhereLike(column, value) {
        this.wheres.push({ column, condition: 'LIKE', value, join: 'OR' });
        return this;
    }
    /**
     * Add a "where not like" clause to the query.
     * @param column The column to evaluate.
     * @param value The value to evaluate against.
     */
    whereNotLike(column, value) {
        this.wheres.push({ column, condition: 'NOT LIKE', value });
        return this;
    }
    /**
     * Add a "or where not like" clause to the query.
     * @param column The column to evaluate.
     * @param value The value to evaluate against.
     */
    orWhereNotLike(column, value) {
        this.wheres.push({ column, condition: 'NOT LIKE', value, join: 'OR' });
        return this;
    }
    /**
     * Add a raw where clause to the query.
     * @param raw The raw condition string.
     * @param bindings The bindings if there are any.
     */
    whereRaw(raw, bindings) {
        this.wheres.push({
            getStatement: () => `AND ${raw}`,
            bindings,
        });
        return this;
    }
    /**
     * Add a raw or where clause to the query.
     * @param raw The raw condition string.
     * @param bindings The bindings if there are any.
     */
    orWhereRaw(raw, bindings) {
        this.wheres.push({
            getStatement: () => `OR ${raw}`,
            bindings,
        });
        return this;
    }
    whereSub(builder) {
        const stmt = this.buildSubQuery(builder);
        this.wheres.push({
            getStatement: () => `(${stmt.getStatement()})`,
            bindings: stmt.bindings,
        });
        return this;
    }
    whereInSub(column, builder) {
        const stmt = this.buildSubQuery(builder);
        this.wheres.push({
            getStatement: () => `${escape_1.escapeColumn(column)} IN (${stmt.getStatement()})`,
            bindings: stmt.bindings,
        });
        return this;
    }
    buildSubQuery(builder) {
        let stmt;
        if (typeof builder === 'function') {
            const config = new kc_config_1.NonPersistentConfig({ db: {} }, new kc_container_1.default());
            const query = builder(new Database_1.Database(config, MySQLBuilder_1.MySQLBuilder));
            stmt = query.getStatement();
        }
        else if ('getStatement' in builder && 'bindings' in builder) {
            stmt = builder;
        }
        else {
            stmt = builder.getStatement();
        }
        return stmt;
    }
    buildWhere() {
        if (this.wheres.length === 0) {
            return { sql: '', bindings: [] };
        }
        let sql = '';
        let bindings = [];
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
            }
            else {
                sql += index === 0 ? '' : where.join || 'AND';
                sql += ` ${escape_1.escapeColumn(where.column)} ${where.condition} ? `;
                bindings.push(where.value);
            }
        });
        return { sql, bindings };
    }
}
exports.CanRunWhereQueries = CanRunWhereQueries;
