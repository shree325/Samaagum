import { PostgresBaseRepository } from './PostgresBaseRepository';
import { ISubscriptionOrder, IR_subscriptionOrders } from './IR_subscriptionOrders';
import prisma from '../config/prisma';

export class R_subscriptionOrders
  extends PostgresBaseRepository<ISubscriptionOrder>
  implements IR_subscriptionOrders
{
  constructor() {
    super('subscription_orders', 'id');
  }

  async updateActiveOrdersState(userId: string, adminPlanIds: string[], state: string): Promise<void> {
    await prisma.subscription_orders.updateMany({
      where: {
        user_id: userId,
        plan_id: { in: adminPlanIds },
        status: 'completed',
        subscription_status: 'active'
      },
      data: {
        subscription_status: state,
        updated_at: new Date()
      }
    });
  }
}
