import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IAdminSubscriptionPlan, IR_adminSubscriptionPlans } from './IR_adminSubscriptionPlans';

export class R_adminSubscriptionPlans
    extends PostgresBaseRepository<IAdminSubscriptionPlan>
    implements IR_adminSubscriptionPlans
{
    constructor() {
        super('admin_subscription_plans', 'id');
    }

    async findActive(tenantId?: string | null): Promise<IAdminSubscriptionPlan[]> {
        const rows = tenantId
            ? await prisma.$queryRawUnsafe<IAdminSubscriptionPlan[]>(
                `SELECT * FROM admin_subscription_plans WHERE is_active = true AND (tenant_id = $1 OR tenant_id IS NULL) ORDER BY CASE WHEN jsonb_typeof(pricing->'monthly') = 'object' THEN (pricing->'monthly'->>'amount')::numeric WHEN jsonb_typeof(pricing->'monthly') = 'number' THEN (pricing->>'monthly')::numeric ELSE NULL END ASC NULLS LAST`,
                tenantId
              )
            : await prisma.$queryRawUnsafe<IAdminSubscriptionPlan[]>(
                `SELECT * FROM admin_subscription_plans WHERE is_active = true ORDER BY CASE WHEN jsonb_typeof(pricing->'monthly') = 'object' THEN (pricing->'monthly'->>'amount')::numeric WHEN jsonb_typeof(pricing->'monthly') = 'number' THEN (pricing->>'monthly')::numeric ELSE NULL END ASC NULLS LAST`
              );
        return rows;
    }

    async findPublic(): Promise<IAdminSubscriptionPlan[]> {
        const rows = await prisma.$queryRawUnsafe<IAdminSubscriptionPlan[]>(
            `SELECT id, name, display_name, description, category, plan_type, is_popular, group_name, pricing, features, limits, trial
             FROM admin_subscription_plans
             WHERE is_active = true AND (visibility->>'hideFromPricing')::boolean IS NOT TRUE
             ORDER BY CASE WHEN jsonb_typeof(pricing->'monthly') = 'object' THEN (pricing->'monthly'->>'amount')::numeric WHEN jsonb_typeof(pricing->'monthly') = 'number' THEN (pricing->>'monthly')::numeric ELSE NULL END ASC NULLS LAST`
        );
        return rows;
    }

    async countActiveSubscribers(planId: string): Promise<number> {
        const rows = await prisma.$queryRawUnsafe<{ count: string }[]>(
            `SELECT COUNT(*) as count FROM subscriptions s
             JOIN plans p ON p.id = s.plan_id
             WHERE s.plan_id = $1::uuid AND s.state = 'active'`,
            planId
        );
        return parseInt(rows[0]?.count || '0', 10);
    }
}
