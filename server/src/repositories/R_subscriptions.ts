import { PostgresBaseRepository } from './PostgresBaseRepository';
import { ISubscription, IR_subscriptions } from './IR_subscriptions';
import pool from '../config/database';

export class R_subscriptions extends PostgresBaseRepository<ISubscription> implements IR_subscriptions {
  constructor() {
    super('subscriptions', 'subscription_id');
  }

  async findByOwnerEntityId(ownerEntityId: string): Promise<ISubscription[]> {
    const query = `SELECT * FROM subscriptions WHERE owner_entity_id = $1`;
    const { rows } = await pool.query(query, [ownerEntityId]);
    return rows;
  }

  async findByPlanId(planId: string): Promise<ISubscription[]> {
    const query = `SELECT * FROM subscriptions WHERE plan_id = $1`;
    const { rows } = await pool.query(query, [planId]);
    return rows;
  }

  async findByState(state: string): Promise<ISubscription[]> {
    const query = `SELECT * FROM subscriptions WHERE state = $1`;
    const { rows } = await pool.query(query, [state]);
    return rows;
  }
}
