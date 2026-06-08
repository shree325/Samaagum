import { IBaseRepository } from './IBaseRepository';

export interface IProduct {
  id?: number;
  title: string;
  description?: string;
  price: number;
  stock: number;
  created_at?: Date;
}

export interface IR_products extends IBaseRepository<IProduct> {
  // Custom product methods can be declared here
}
