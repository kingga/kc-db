import { IJoin, JoinInfo, CallableJoinInfo } from '../contracts/IJoin';
import { escapeTable, escapeColumn } from '../../escape';
import { JoinBuilder } from '../JoinBuilder';
import { BindedQuery } from '../../contracts/IBuilder';

export class Join implements IJoin {
  protected readonly join: JoinInfo | CallableJoinInfo;
  protected readonly importantMsg: string;

  public constructor(info: JoinInfo | CallableJoinInfo) {
    this.join = info;
    this.importantMsg =
      'How dare you break the laws of programming.' +
      'You have done the impossible by reaching this point or you are a scrub using normal JS.';
  }

  public toSql(query: BindedQuery): void {
    if ('join' in this.join) {
      this.advancedJoinSql(query);
    }

    this.simpleJoinSql(query);
  }

  protected simpleJoinSql(query: BindedQuery): void {
    if ('columnA' in this.join) {
      const { type, table, columnA, condition, columnB } = this.join;
      const ec = escapeColumn;
      const et = escapeTable;

      query.sql += `${type} JOIN ${et(table)} ON ${ec(columnA)} ${condition || '='} ${ec(columnB)}`;
    } else if ('join' in this.join) {
      return this.advancedJoinSql(query);
    }

    throw new Error(this.importantMsg);
  }

  protected advancedJoinSql(query: BindedQuery): void {
    if ('join' in this.join) {
      const { type, table, join } = this.join;
      const builder = new JoinBuilder();
      join(builder);

      query.sql += `${type} JOIN ${escapeTable(table)} ON (`;
      builder.toSql(query);
      query.sql += ')';
    } else if ('columnA' in this.join) {
      return this.simpleJoinSql(query);
    }

    throw new Error(this.importantMsg);
  }
}
