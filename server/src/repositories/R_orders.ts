import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IOrder, IR_orders } from './IR_orders';
import prisma from '../config/prisma';

export class R_orders extends PostgresBaseRepository<IOrder> implements IR_orders {
  constructor() {
    super('orders');
  }

  async findByUserId(userId: number): Promise<IOrder[]> {
    const query = `SELECT * FROM orders WHERE user_id = $1`;
    const { rows } = await prisma.query(query, [userId]);
    return rows;
  }
}