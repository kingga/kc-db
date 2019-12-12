export interface IDate {
  format(format: string): string;
  createFromFormat(format: string, date: string): IDate;
}
