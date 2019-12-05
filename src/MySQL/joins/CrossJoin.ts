import { IJoin } from '../contracts/IJoin';
import { escapeTable } from '../../escape';

export class CrossJoin implements IJoin {
  protected table: string;

  public constructor(table: string) {
    this.table = table;
  }

  public toSql(): string {
    return `CROSS JOIN ${escapeTable(this.table)}`;
  }
}
