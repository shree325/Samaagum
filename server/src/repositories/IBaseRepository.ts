export interface IBaseRepository<T> {
  getById(id: string | number): Promise<T | null>;
  findOne(filter: object): Promise<T | null>;
  findAll(filter?: object): Promise<T[]>;
  create(data: Partial<T>): Promise<T>;
  update(id: string | number, data: Partial<T>): Promise<T | null>;
  delete(id: string | number): Promise<boolean>;
  count(filter?: object): Promise<number>;
}
