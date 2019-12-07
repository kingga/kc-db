import { CallableJoinInfo, IJoin, JoinInfo } from '../../contracts/IJoin';
import { escapeColumn, escapeTable } from '../../escape';
import { BindedQuery } from '../../types';
import { JoinBuilder } from '../JoinBuilder';

export class Join implements IJoin {
  protected readonly join: JoinInfo | CallableJoinInfo;
  protected readonly importantMsg: string;

  public constructor(info: JoinInfo | CallableJoinInfo) {
    this.join = info;
    this.importantMsg =
      'How dare you break the laws of programming.' +
      'You have done the impossible by reaching this point or you are a scrub using normal JS.';
  }

  public toSql(): BindedQuery {
    if ('join' in this.join) {
      return this.advancedJoinSql();
    }

    return this.simpleJoinSql();
  }

  protected simpleJoinSql(): BindedQuery {
    if ('columnA' in this.join) {
      const { type, table, columnA, condition, columnB } = this.join;
      const ec = escapeColumn;
      const et = escapeTable;

      return {
        sql: `${type} JOIN ${et(table)} ON ${ec(columnA)} ${condition || '='} ${ec(columnB)}`,
        bindings: [],
      };
    } else if ('join' in this.join) {
      return this.advancedJoinSql();
    }

    throw new Error(this.importantMsg);
  }

  protected advancedJoinSql(): BindedQuery {
    if ('join' in this.join) {
      const { type, table, join } = this.join;
      const builder = new JoinBuilder();
      join(builder);

      const query = builder.toSql();
      const sql = `${type} JOIN ${escapeTable(table)} ON (${query.sql})`;

      return {
        sql,
        bindings: query.bindings,
      };
    } else if ('columnA' in this.join) {
      return this.simpleJoinSql();
    }

    throw new Error(this.importantMsg);
  }
}
