import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IPlan, IR_plans } from './IR_plans';
import pool from '../config/database';

export class R_plans extends PostgresBaseRepository<IPlan> implements IR_plans {
  constructor() {
    super('plans', 'plan_id');
  }

  async findByPlanType(planType: string): Promise<IPlan[]> {
    const query = `SELECT * FROM plans WHERE plan_type = $1`;
    const { rows } = await pool.query(query, [planType]);
    return rows;
  }

  async findByStatus(status: string): Promise<IPlan[]> {
    const query = `SELECT * FROM plans WHERE status = $1`;
    const { rows } = await pool.query(query, [status]);
    return rows;
  }
}
