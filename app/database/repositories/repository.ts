import { getConnection } from "typeorm";
import { IRepositorySerializer } from "../../interfaces/repository_serializer";
import {ISearchApiOptions} from "../../interfaces/search_api_options";
import * as _ from "lodash";
import { UpdateResult } from "typeorm/query-builder/result/UpdateResult";

export abstract class Repository<T> {
  constructor(
    protected record: any,
    protected serializer: IRepositorySerializer<T>,
    protected dbConnectionName = 'default'
  ) {}

  public async findAll(criteria?: any): Promise<T[]> {
    const records = await this.findAllRecords(criteria);
    return records.map(this.deserialize.bind(this));
  }

  public async find(id: string | number): Promise<T|undefined> {
    const record = await this.findRecord(id);
    return record && this.deserialize(record);
  }

  public async findOrFail(id: string | number): Promise<T> {
    const result = await this.find(id);

    if (!result) {
      throw new Error(`Could not find a ${this.record} record with ID ${id}`);
    }

    return result;
  }

  /**
   * findWithPagination
   *
   * Select query used for UI autocomplete
   *
   * @param {string[]} select - columns that will be queried against
   * @param {string} query - the query term
   * @param {number} offset - page number
   * @param {number} limit - number of records per page
   * @param {IOrder} order - order.by = column to sort by, order.direction = column direction
   * @returns {Promise<T[]>}
   */
  public async findWithPagination({select, query, offset, limit, order}: ISearchApiOptions): Promise<T[]> {

    const tableName = this.repository.metadata.tableName;
    const constraints = `ORDER BY ${order.by} ${order.direction} LIMIT ${limit} OFFSET ${ offset };`;

    function createQueryForMultipleParams(selections, queries) {
      const queryColumns = _.map(_.tail(selections), (column, ix) => {
        return `OR ${selections[ix]} ILIKE '%${queries}%' `;
      });
      const queryStatement = _.join(queryColumns, "");
      const selectColumns = `SELECT * FROM ${tableName} WHERE ${selections[1]} ILIKE '%${query}%' ${queryStatement}`;
      const rawData = `${selectColumns}${constraints}`;
      return rawData;
    }

    function createQueryForSingleParam() {
      const selectColumns = `SELECT * FROM ${tableName} WHERE ${select} ILIKE '%${query}%' `;
      const rawData = `${selectColumns}${constraints}`;
      return rawData;
    }

    const rawQuery = (select.length > 1)
      ? createQueryForMultipleParams(select, query)
      : createQueryForSingleParam();

    const records = await this
        .connection
        .query(rawQuery);

    return records.map(this.deserialize.bind(this));
  }

  public async bulkDeleteWhere(criteria: any) {
    return await this.repository.delete(criteria);
  }

  public async bulkDelete(ids: any []) {
    return await this.repository.delete(ids);
  }

  public async truncate(): Promise<void> {
    return await this.repository.clear();
  }

  // TODO - this actually performs an upsert. change to insert.
  public async insert(data: Partial<T>): Promise<T> {
    const record = await this.insertRecord(this.serialize(data));
    return this.deserialize(record);
  }

  public async upsert(data: Partial<T>): Promise<T> {
    const record = await this.insertRecord(this.serialize(data));
    return this.deserialize(record);
  }

  public async bulkInsert(data: T[]) {
    const serializedData = data.map(this.serialize.bind(this));
    return await this.repository.save(serializedData);
  }

  public async bulkInsertRaw(data: any[]) {
    return await this.repository.insert(data);
  }

  public async update(id: string | number | null, data: Partial<T>): Promise<UpdateResult> {
    return await this.updateRecord(id!, this.serializePartial(data));
  }

  public async updateWhere(criteria: Partial<T>, data: Partial<T>) {
    return await this.repository.update(this.serializePartial(criteria), this.serializePartial(data));
  }

  public async last(): Promise<T> {
    const record = await this.getLastRecord();

    if (!record) {
      throw new Error(`Could not find any ${this.record} records`);
    }

    return this.deserialize(record);
  }

  public async count(criteria?: any): Promise<number> {
    return await this.repository.count(criteria);
  }

  public insertRecord(data: any) {
    return this.repository.save(data);
  }

  public get connection() {
    return getConnection(this.dbConnectionName);
  }

  protected serialize(data: Partial<T>): any {
    return this.serializer.serialize(data);
  }

  protected serializePartial(data: Partial<T>) {
    const fullySerialized = this.serialize(data);

    const subset = {};

    Object.keys(fullySerialized).forEach((key) => {
      if (fullySerialized[key] !== undefined) {
        subset[key] = fullySerialized[key];
      }
    });

    return subset;
  }

  protected deserialize(object: any): T {
    return this.serializer.deserialize(object);
  }

  protected get repository() {
    return this.connection.getRepository(this.record);
  }

  protected findRecord(id: string | number) {
    return this.repository.findOne(id);
  }

  protected findAllRecords(criteria?: any) {
    return this.repository.find(criteria);
  }

  protected updateRecord(id: string | number, data: any) {
    return this.repository.update({ id }, data);
  }

  protected async getLastRecord() {
    const records = await this.findAllRecords();
    return records[records.length - 1];
  }
}
