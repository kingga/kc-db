"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = require("../../escape");
class CrossJoin {
    constructor(table) {
        this.table = table;
    }
    toSql() {
        return {
            sql: `CROSS JOIN ${escape_1.escapeTable(this.table)}`,
            bindings: [],
        };
    }
}
exports.CrossJoin = CrossJoin;
