"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = require("mysql2/promise");
function getAlias(parts) {
    // Don't escape again.
    if (parts[0].startsWith('`') && parts[parts.length - 1].endsWith('`')) {
        return parts.join(' ').trim();
    }
    // Find the position of 'AS' and then join everything after it as the alias.
    parts = parts.map((v) => v.trim()).filter((v) => v.length > 0);
    const index = parts.findIndex((v) => v.toUpperCase() === 'AS');
    const alias = parts.filter((_v, i) => i > index).join(' ').trim();
    return `\`${alias}\``;
}
function escapeColumn(column) {
    column = column.trim();
    let table = '';
    // Don't escape twice.
    if (column.startsWith('`') && column.endsWith('`')) {
        return column;
    }
    // If there is a dot in the column split it into two.
    if (column.indexOf('.') > 0) {
        [table, column] = column.split('.', 2);
    }
    // Escape 'x AS y' as well.
    if (column.toUpperCase().indexOf(' AS ') > 0) {
        const parts = column.split(' ');
        parts[0] = parts[0].trim();
        // Don't escape twice.
        if (parts[0].startsWith('`') && parts[0].endsWith('`')) {
            column = parts[0];
        }
        else {
            column = `\`${parts[0]}\``;
        }
        column += ` AS ${getAlias(parts)}`;
    }
    else if (column.substr(0, 1) !== '`') {
        column = `\`${column}\``;
    }
    if (table) {
        return `\`${table}\`.${column}`;
    }
    return column;
}
exports.escapeColumn = escapeColumn;
function escapeValue(value) {
    return promise_1.escape(value);
}
exports.escapeValue = escapeValue;
function escapeValues(values) {
    return values.map((value) => escapeValue(value));
}
exports.escapeValues = escapeValues;
function escapeTable(table) {
    // If there is a space and 'AS' then split it by space and key the first and last value.
    table = table.trim();
    if (table.toUpperCase().indexOf(' AS ') > 0) {
        let parts = table.split(' ');
        table = escapeColumn(parts[0].trim());
        table += ` AS ${getAlias(parts)}`;
    }
    else {
        table = escapeColumn(table);
    }
    return table;
}
exports.escapeTable = escapeTable;
