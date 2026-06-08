import { IBaseRepository } from './IBaseRepository';

export interface IOrder {
  id?: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at?: Date;
}

export interface IR_orders extends IBaseRepository<IOrder> {
  findByUserId(userId: number): Promise<IOrder[]>;
}
