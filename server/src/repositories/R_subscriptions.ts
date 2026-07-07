import { PostgresBaseRepository } from './PostgresBaseRepository';
import { ISubscription, IR_subscriptions } from './IR_subscriptions';
import prisma from '../config/prisma';

export class R_subscriptions extends PostgresBaseRepository<ISubscription> implements IR_subscriptions {
  constructor() {
    super('subscriptions', 'subscription_id');
  }

  async findByOwnerEntityId(ownerEntityId: string): Promise<ISubscription[]> {
    const query = `SELECT * FROM subscriptions WHERE owner_entity_id = $1`;
    const { rows } = await prisma.query(query, [ownerEntityId]);
    return rows;
  }

  async findByPlanId(planId: string): Promise<ISubscription[]> {
    const query = `SELECT * FROM subscriptions WHERE plan_id = $1`;
    const { rows } = await prisma.query(query, [planId]);
    return rows;
  }

  async findByState(state: string): Promise<ISubscription[]> {
    const query = `SELECT * FROM subscriptions WHERE state = $1`;
    const { rows } = await prisma.query(query, [state]);
    return rows;
  }

  async getExpiredActiveSubscriptions(ownerEntityId: string): Promise<any[]> {
    return await prisma.subscriptions.findMany({
      where: {
        owner_entity_id: ownerEntityId,
        state: 'active',
        valid_to: { lte: new Date() }
      },
      include: {
        plans: true
      }
    });
  }

  async updateState(subscriptionIds: string[], state: string): Promise<void> {
    await prisma.subscriptions.updateMany({
      where: {
        id: { in: subscriptionIds }
      },
      data: {
        state: state as any,
        updated_at: new Date()
      }
    });

  }

  async getActiveSubscription(ownerEntityId: string): Promise<any | null> {
    return await prisma.subscriptions.findFirst({
      where: {
        owner_entity_id: ownerEntityId,
        state: 'active',
        valid_from: { lte: new Date() },
        OR: [
          { valid_to: null },
          { valid_to: { gte: new Date() } }
        ]
      },
      include: {
        plans: true
      }
    });
  }
}

