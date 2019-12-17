"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = require("../../escape");
const JoinBuilder_1 = require("../JoinBuilder");
class Join {
    constructor(info) {
        this.join = info;
        this.importantMsg =
            'How dare you break the laws of programming.' +
                'You have done the impossible by reaching this point or you are a scrub using normal JS.';
    }
    toSql() {
        if ('join' in this.join) {
            return this.advancedJoinSql();
        }
        return this.simpleJoinSql();
    }
    simpleJoinSql() {
        if ('columnA' in this.join) {
            const { type, table, columnA, condition, columnB } = this.join;
            const ec = escape_1.escapeColumn;
            const et = escape_1.escapeTable;
            return {
                sql: `${type} JOIN ${et(table)} ON ${ec(columnA)} ${condition || '='} ${ec(columnB)}`,
                bindings: [],
            };
        }
        throw new Error(this.importantMsg);
    }
    advancedJoinSql() {
        if ('join' in this.join) {
            const { type, table, join } = this.join;
            const builder = new JoinBuilder_1.JoinBuilder();
            join(builder);
            const query = builder.toSql();
            const sql = `${type} JOIN ${escape_1.escapeTable(table)} ON (${query.sql})`;
            return {
                sql,
                bindings: query.bindings,
            };
        }
        throw new Error(this.importantMsg);
    }
}
exports.Join = Join;
