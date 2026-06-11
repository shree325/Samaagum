import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IMembershipSubscription, IR_membershipSubscriptions } from './IR_membershipSubscriptions';
import prisma from '../config/prisma';

export class R_membershipSubscriptions extends PostgresBaseRepository<IMembershipSubscription> implements IR_membershipSubscriptions {
  constructor() {
    super('membership_subscriptions', 'subscription_id');
  }

  async findByUserId(userId: string): Promise<IMembershipSubscription[]> {
    const query = `SELECT * FROM membership_subscriptions WHERE user_id = $1`;
    const { rows } = await prisma.query(query, [userId]);
    return rows;
  }

  async findByTierId(tierId: string): Promise<IMembershipSubscription[]> {
    const query = `SELECT * FROM membership_subscriptions WHERE tier_id = $1`;
    const { rows } = await prisma.query(query, [tierId]);
    return rows;
  }
}
