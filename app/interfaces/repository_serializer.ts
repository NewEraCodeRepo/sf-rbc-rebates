export interface IRepositorySerializer<T> {
  serialize(object: Partial<T>): any;
  deserialize(data: any): T;
}
