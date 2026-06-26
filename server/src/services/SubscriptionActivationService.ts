import prisma from '../config/prisma';

export class SubscriptionActivationService {
    /**
     * Activates a subscription for a completed order.
     * Updates order subscription status and user role assignments in a safe transaction.
     */
    static async activate(orderId: string): Promise<boolean> {
        console.log(`Subscription activation started for order: ${orderId}`);
        try {
            const result = await prisma.$transaction(async (tx) => {
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

                const planNameLower = plan.name.toLowerCase();

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

                // --- Persistence Fix starts here ---
                console.log('Payment verified');
                console.log('Subscription activation started');

                // 2a. Find or create core plan in core plans table
                let corePlan = await tx.plans.findUnique({
                    where: { key: planNameLower }
                });

                if (!corePlan) {
                    console.log(`Creating core plan record for key: ${planNameLower}`);
                    corePlan = await tx.plans.create({
                        data: {
                            key: planNameLower,
                            plan_type: plan.plan_type || 'monthly',
                            version: 1,
                            entitlements: plan.features || {},
                            status: 'active'
                        }
                    });
                }

                // 2b. Find or create user entity in entities table (required to satisfy foreign key constraint on subscriptions)
                let userEntity = await tx.entities.findFirst({
                    where: { user_id: order.user_id, entity_type: 'user' }
                });

                if (!userEntity) {
                    console.log(`Creating user entity record for user: ${order.user_id}`);
                    userEntity = await tx.entities.create({
                        data: {
                            tenant_id: order.tenant_id || '00000000-0000-0000-0000-000000000000',
                            entity_type: 'user',
                            user_id: order.user_id,
                            status: 'active',
                            visibility: 'public'
                        }
                    });
                }

                // 2c. Check if active subscriptions already exist for this owner entity
                const existingSubscriptions = await tx.subscriptions.findMany({
                    where: { 
                        owner_entity_id: userEntity.id,
                        state: 'active'
                    }
                });

                if (existingSubscriptions.length > 0) {
                    console.log(`Deactivating ${existingSubscriptions.length} previous subscriptions...`);
                    await tx.subscriptions.updateMany({
                        where: {
                            owner_entity_id: userEntity.id,
                            state: 'active'
                        },
                        data: {
                            state: 'inactive',
                            updated_at: new Date()
                        }
                    });
                }

                console.log('Creating new subscription record');
                const newSub = await tx.subscriptions.create({
                    data: {
                        tenant_id: order.tenant_id || '00000000-0000-0000-0000-000000000000',
                        plan_id: corePlan.id,
                        owner_entity_id: userEntity.id,
                        state: 'active',
                        valid_from: startDate,
                        valid_to: endDate,
                        created_at: new Date(),
                        updated_at: new Date()
                    }
                });
                console.log(`Subscription record created with ID: ${newSub.id}`);
                // --- Persistence Fix ends here ---

                // 3. Determine role to assign
                let targetRoleId: string | null = null;
                if (plan.rbac_auto_assign && plan.rbac_role_id) {
                    const adminRole = await tx.admin_roles.findUnique({
                        where: { id: plan.rbac_role_id }
                    });
                    if (adminRole) {
                        const roleRecord = await tx.roles.findUnique({
                            where: { key: adminRole.name }
                        });
                        if (roleRecord) {
                            targetRoleId = roleRecord.id;
                        }
                    }
                } else {
                    // Fallback roles based on plan name/type
                    const planNameLowerVal = plan.name.toLowerCase();
                    let fallbackRoleName = 'free_user';
                    if (planNameLowerVal.includes('premium') || planNameLowerVal.includes('pro')) {
                        fallbackRoleName = 'pro_host';
                    } else if (planNameLowerVal.includes('enterprise') || planNameLowerVal.includes('business')) {
                        fallbackRoleName = 'enterprise_host';
                    } else if (planNameLowerVal.includes('basic') || planNameLowerVal.includes('standard')) {
                        fallbackRoleName = 'basic_host';
                    }

                    const roleRecord = await tx.roles.findUnique({
                        where: { key: fallbackRoleName }
                    });

                    if (roleRecord) {
                        targetRoleId = roleRecord.id;
                    } else {
                        const defaultRole = await tx.roles.findFirst({
                            where: { key: 'member' }
                        });
                        if (defaultRole) {
                            targetRoleId = defaultRole.id;
                        }
                    }
                }

                // 4. Assign role in role_assignments table
                if (targetRoleId) {
                    const roleExists = await tx.roles.findUnique({
                        where: { id: targetRoleId }
                    });

                    if (roleExists) {
                        await tx.$executeRawUnsafe(
                            `DELETE FROM role_assignments WHERE user_id = $1::uuid AND scope_entity_id IS NULL`,
                            order.user_id
                        );

                        await tx.$executeRawUnsafe(
                            `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, created_at, updated_at)
                             VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, now(), now())`,
                            order.tenant_id,
                            order.user_id,
                            targetRoleId
                        );

                        console.log(`[SubscriptionActivationService] Assigned role ${targetRoleId} to user ${order.user_id}`);
                    } else {
                        console.error(`[SubscriptionActivationService] Role ${targetRoleId} does not exist in roles table`);
                    }
                } else {
                    console.warn(`[SubscriptionActivationService] No role determined for activation (order: ${orderId})`);
                }

                console.log('Transaction committed');
                return true;
            });
            return result;
        } catch (err: any) {
            console.error('[SubscriptionActivationService] Prisma transaction error:', err);
            return false;
        }
    }

    /**
     * Switches the user's active subscription to a previously purchased, unexpired plan.
     */
    static async switchPlan(orderId: string): Promise<boolean> {
        console.log(`Subscription switch started for order: ${orderId}`);
        try {
            return await prisma.$transaction(async (tx) => {
                // 1. Fetch Target Order
                const targetOrder = await tx.subscription_orders.findUnique({
                    where: { id: orderId }
                });

                if (!targetOrder || targetOrder.status !== 'completed') {
                    console.error(`[SubscriptionActivationService] Order ${orderId} not valid for switching`);
                    return false;
                }

                if (!targetOrder.subscription_end_date || targetOrder.subscription_end_date <= new Date()) {
                    console.error(`[SubscriptionActivationService] Order ${orderId} has expired`);
                    return false;
                }

                // 2. Fetch Target Plan
                const plan = await tx.admin_subscription_plans.findUnique({
                    where: { id: targetOrder.plan_id }
                });

                if (!plan) return false;
                const planNameLower = plan.name.toLowerCase();

                // 3. Deactivate current active orders
                await tx.subscription_orders.updateMany({
                    where: {
                        user_id: targetOrder.user_id,
                        id: { not: orderId },
                        subscription_status: 'active'
                    },
                    data: {
                        subscription_status: 'inactive',
                        updated_at: new Date()
                    }
                });

                // Activate target order
                await tx.subscription_orders.update({
                    where: { id: orderId },
                    data: {
                        subscription_status: 'active',
                        updated_at: new Date()
                    }
                });

                // 4. Update core subscriptions
                let corePlan = await tx.plans.findUnique({ where: { key: planNameLower } });
                if (!corePlan) {
                    corePlan = await tx.plans.create({
                        data: {
                            key: planNameLower,
                            plan_type: plan.plan_type || 'monthly',
                            version: 1,
                            entitlements: plan.features || {},
                            status: 'active'
                        }
                    });
                }

                let userEntity = await tx.entities.findFirst({
                    where: { user_id: targetOrder.user_id, entity_type: 'user' }
                });

                if (userEntity) {
                    // Deactivate existing active subscriptions
                    await tx.subscriptions.updateMany({
                        where: { owner_entity_id: userEntity.id, state: 'active' },
                        data: { state: 'inactive', updated_at: new Date() }
                    });

                    // Create new active subscription mirroring the target order dates
                    await tx.subscriptions.create({
                        data: {
                            tenant_id: targetOrder.tenant_id || '00000000-0000-0000-0000-000000000000',
                            plan_id: corePlan.id,
                            owner_entity_id: userEntity.id,
                            state: 'active',
                            valid_from: targetOrder.subscription_start_date || new Date(),
                            valid_to: targetOrder.subscription_end_date,
                            created_at: new Date(),
                            updated_at: new Date()
                        }
                    });
                }

                // 5. Update Roles
                let targetRoleId: string | null = null;
                if (plan.rbac_auto_assign && plan.rbac_role_id) {
                    const adminRole = await tx.admin_roles.findUnique({ where: { id: plan.rbac_role_id } });
                    if (adminRole) {
                        const roleRecord = await tx.roles.findUnique({ where: { key: adminRole.name } });
                        if (roleRecord) targetRoleId = roleRecord.id;
                    }
                } else {
                    let fallbackRoleName = 'free_user';
                    if (planNameLower.includes('premium') || planNameLower.includes('pro')) fallbackRoleName = 'pro_host';
                    else if (planNameLower.includes('enterprise') || planNameLower.includes('business')) fallbackRoleName = 'enterprise_host';
                    else if (planNameLower.includes('basic') || planNameLower.includes('standard')) fallbackRoleName = 'basic_host';

                    const roleRecord = await tx.roles.findUnique({ where: { key: fallbackRoleName } });
                    if (roleRecord) targetRoleId = roleRecord.id;
                    else {
                        const defaultRole = await tx.roles.findFirst({ where: { key: 'member' } });
                        if (defaultRole) targetRoleId = defaultRole.id;
                    }
                }

                if (targetRoleId) {
                    await tx.$executeRawUnsafe(`DELETE FROM role_assignments WHERE user_id = $1::uuid AND scope_entity_id IS NULL`, targetOrder.user_id);
                    await tx.$executeRawUnsafe(
                        `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, created_at, updated_at) VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, now(), now())`,
                        targetOrder.tenant_id, targetOrder.user_id, targetRoleId
                    );
                }

                return true;
            });
        } catch (err) {
            console.error('[SubscriptionActivationService] Error switching plan:', err);
            return false;
        }
    }
}
