import { escape } from 'mysql';
import { WhereValue } from './contracts/IBuilder';

export function escapeColumn(column: string): string {
  // If there is a dot in the column split it into two.
  column = column.trim();

  if (column.indexOf('.') > 0) {
    let table: string;
    [table, column] = column.split('.', 2);

    // Escape 'x AS y' as well.
    if (column.toUpperCase().indexOf(' AS ') > 0) {
      const parts = column.split(' ');
      column = `\`${parts[0].trim()}\``;
      column += ` AS ${parts[parts.length - 1].trim()}`;
    } else {
      column = `\`${column}\``;
    }

    return `\`${table}\`.${column}`;
  }

  return `\`${column}\``;
}

export function escapeValue(value: WhereValue): WhereValue {
  return escape(value);
}

export function escapeValues(values: WhereValue[]): WhereValue[] {
  return values.map((value) => escapeValue(value));
}

export function escapeTable(table: string): string {
  // If there is a space and 'AS' then split it by space and key the first and last value.
  table = table.trim();

  if (table.toUpperCase().indexOf(' AS ') > 0) {
    const parts = table.split(' ');
    table = escapeColumn(parts[0].trim());
    table += ` AS ${escapeColumn(parts[parts.length - 1].trim())}`;
  } else {
    table = escapeColumn(table);
  }

  return table;
}
