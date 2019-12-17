"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escape_1 = require("../escape");
const CanRunWhereQueries_1 = require("./traits/CanRunWhereQueries");
class JoinBuilder extends CanRunWhereQueries_1.CanRunWhereQueries {
    on(columnA, condition, columnB) {
        this.whereRaw(`${escape_1.escapeColumn(columnA)} ${condition} ${escape_1.escapeColumn(columnB)}`);
        return this;
    }
    toSql() {
        return this.buildWhere();
    }
}
exports.JoinBuilder = JoinBuilder;
