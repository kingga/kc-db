import { IJoin } from '../../contracts/IJoin';
import { escapeTable } from '../../escape';
import { BindedQuery } from '../../types';

export class CrossJoin implements IJoin {
  protected table: string;

  public constructor(table: string) {
    this.table = table;
  }

  public toSql(): BindedQuery {
    return {
      sql: `CROSS JOIN ${escapeTable(this.table)}`,
      bindings: [],
    };
  }
}
