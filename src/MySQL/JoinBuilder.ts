import { IJoinBuilder, ConditionType } from '../contracts/IBuilder';
import { escapeColumn } from '../escape';
import { CanRunWhereQueries } from './traits/CanRunWhereQueries';

export class JoinBuilder extends CanRunWhereQueries<IJoinBuilder> implements IJoinBuilder {
  public on(columnA: string, condition: ConditionType, columnB: string): IJoinBuilder {
    this.whereRaw(`${escapeColumn(columnA)} ${condition} ${escapeColumn(columnB)}`);

    return this;
  }

  public toSql(): string {
    return '';
  }
}
