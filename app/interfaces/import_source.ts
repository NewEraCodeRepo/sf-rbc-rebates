import {ITransactionForRebateCriteria} from "datapipeline-schemas/rebateManagementObject";

export interface IImportSource {
  transactions: ITransactionForRebateCriteria[];
  perform(): any;
  readFixtureBuffer?(file: string): any;
  readFixture?(file: string): any;
}
