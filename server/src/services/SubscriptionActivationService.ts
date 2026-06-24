import prisma from '../config/prisma';

export class SubscriptionActivationService {
    /**
     * Activates a subscription for a completed order.
     * Updates order subscription status and user role assignments in a safe transaction.
     */
    static async activate(orderId: string): Promise<boolean> {
        return prisma.$transaction(async (tx) => {
            // 1. Fetch Order
            const order = await tx.subscription_orders.findUnique({
                where: { id: orderId }
            });

            if (!order) {
                console.error(`[SubscriptionActivationService] Order ${orderId} not found`);
                return false;
            }

            if (order.status !== 'completed') {
                console.warn(`[SubscriptionActivationService] Order ${orderId} is not in completed status (current: ${order.status})`);
                return false;
            }

            // Calculate dates
            const startDate = new Date();
            const endDate = new Date();
            if (order.plan_type === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }

            // 2. Fetch Subscription Plan
            const plan = await tx.admin_subscription_plans.findUnique({
                where: { id: order.plan_id }
            });

            if (!plan) {
                console.error(`[SubscriptionActivationService] Plan ${order.plan_id} not found for order ${orderId}`);
                return false;
            }

            // Update order dates and subscription status
            await tx.subscription_orders.update({
                where: { id: orderId },
                data: {
                    subscription_start_date: startDate,
                    subscription_end_date: endDate,
                    subscription_status: 'active',
                    updated_at: new Date()
                }
            });

            // 3. Determine role to assign
            let targetRoleId: string | null = null;
            if (plan.rbac_auto_assign && plan.rbac_role_id) {
                targetRoleId = plan.rbac_role_id;
            } else {
                // Fallback roles based on plan name/type
                const planNameLower = plan.name.toLowerCase();
                let fallbackRoleName = 'free_user';
                if (planNameLower.includes('premium') || planNameLower.includes('pro')) {
                    fallbackRoleName = 'pro_host';
                } else if (planNameLower.includes('enterprise') || planNameLower.includes('business')) {
                    fallbackRoleName = 'enterprise_host';
                } else if (planNameLower.includes('basic') || planNameLower.includes('standard')) {
                    fallbackRoleName = 'basic_host';
                }

                const fallbackRole = await tx.admin_roles.findFirst({
                    where: { name: fallbackRoleName, is_active: true }
                });

                if (fallbackRole) {
                    targetRoleId = fallbackRole.id;
                } else {
                    // Default to first active role
                    const defaultRole = await tx.admin_roles.findFirst({
                        where: { is_default: true, is_active: true }
                    });
                    if (defaultRole) {
                        targetRoleId = defaultRole.id;
                    }
                }
            }

            // 4. Assign role in role_assignments table
            if (targetRoleId) {
                // Remove existing active assignments for this user to avoid conflicts
                // (usually a user has only one primary role at a time in this flow)
                await tx.$executeRawUnsafe(
                    `DELETE FROM role_assignments WHERE user_id = $1::uuid`,
                    order.user_id
                );

                // Insert new role assignment
                // Note: we use executeRawUnsafe to circumvent Prisma type safety limits if schema differs
                await tx.$executeRawUnsafe(
                    `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, created_at, updated_at)
                     VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, now(), now())`,
                    order.tenant_id,
                    order.user_id,
                    targetRoleId
                );

                console.log(`[SubscriptionActivationService] Assigned role ${targetRoleId} to user ${order.user_id}`);
            } else {
                console.warn(`[SubscriptionActivationService] No role determined for activation (order: ${orderId})`);
            }

            return true;
        });
    }
}
