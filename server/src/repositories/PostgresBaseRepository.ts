import prisma from '../config/prisma';
import { IBaseRepository } from './IBaseRepository';

export class PostgresBaseRepository<T> implements IBaseRepository<T> {
  protected tableName: string;
  protected pkName: string;
  protected dbModel: any;

  constructor(tableName: string, pkName: string = 'id') {
    this.tableName = tableName;
    this.pkName = pkName;
    // Direct Prisma model delegation
    this.dbModel = (prisma as any)[tableName];
  }

  async getById(id: string | number): Promise<T | null> {
    if (!this.dbModel) throw new Error(`Model ${this.tableName} not found in Prisma`);
    return this.dbModel.findUnique({
      where: { [this.pkName]: id }
    });
  }

  async findOne(filter: object): Promise<T | null> {
    if (!this.dbModel) throw new Error(`Model ${this.tableName} not found in Prisma`);
    return this.dbModel.findFirst({
      where: filter
    });
  }

  async findAll(filter?: object): Promise<T[]> {
    if (!this.dbModel) throw new Error(`Model ${this.tableName} not found in Prisma`);
    return this.dbModel.findMany({
      where: filter || {}
    });
  }

  async create(data: Partial<T>): Promise<T> {
    if (!this.dbModel) throw new Error(`Model ${this.tableName} not found in Prisma`);
    return this.dbModel.create({
      data: data as any
    });
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    if (!this.dbModel) throw new Error(`Model ${this.tableName} not found in Prisma`);
    return this.dbModel.update({
      where: { [this.pkName]: id },
      data: data as any
    });
  }

  async delete(id: string | number): Promise<boolean> {
    if (!this.dbModel) throw new Error(`Model ${this.tableName} not found in Prisma`);
    try {
      await this.dbModel.delete({
        where: { [this.pkName]: id }
      });
      return true;
    } catch {
      return false;
    }
  }
}
