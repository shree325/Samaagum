import prisma from '../config/prisma';
import { PlanEntitlementService } from './PlanEntitlementService';

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
                            state: 'cancelled',
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
            if (result) {
                const order = await prisma.subscription_orders.findUnique({ where: { id: orderId } });
                if (order) {
                    PlanEntitlementService.invalidate(order.user_id);
                }
            }
            return result;
        } catch (err: any) {
            console.error('[SubscriptionActivationService] Prisma transaction error:', err);
            return false;
        }
    }

    /**
     * After successful activation, sends real-time socket notification and emails invoice with PDF.
     * Called non-blocking (fire-and-forget) after the main activate() transaction.
     */
    static async notifyAndSendInvoice(orderId: string): Promise<void> {
        try {
            const order = await prisma.subscription_orders.findUnique({
                where: { id: orderId },
                include: {
                    admin_subscription_plans: true,
                    users: { select: { id: true, primary_email: true, first_name: true, last_name: true, profiles: { select: { display_name: true } } } }
                }
            });
            if (!order) {
                console.error(`[SubscriptionActivationService] notifyAndSendInvoice: Order ${orderId} not found in database.`);
                return;
            }
            if (!order.users) {
                console.error(`[SubscriptionActivationService] notifyAndSendInvoice: Order ${orderId} has no associated user.`);
                return;
            }

            const user = order.users;
            if (!user.primary_email) {
                console.warn(`[SubscriptionActivationService] User ${user.id} has no primary email. Cannot send activation invoice/email.`);
                return;
            }
            console.log(`[SubscriptionActivationService] Starting notifyAndSendInvoice for order ${orderId}, user: ${user.id}, email: ${user.primary_email}`);
            const emailTo = user.primary_email;
            const planName = order.admin_subscription_plans?.display_name || 'Standard';
            const displayName = user.profiles?.display_name || [user.first_name, user.last_name].filter(Boolean).join(' ') || emailTo.split('@')[0];

            // 1. Log notification to database so it shows up in in-app notifications
            try {
                await prisma.notification_log.create({
                    data: {
                        tenant_id: order.tenant_id || "00000000-0000-0000-0000-000000000000",
                        user_id: user.id,
                        channel: "socket",
                        template_key: "subscription_activated",
                        status: "sent",
                        provider_ref: JSON.stringify({
                            planName,
                            orderId: order.id,
                            orderNumber: order.order_number
                        })
                    }
                });
                console.log(`[SubscriptionActivationService] Written subscription_activated notification to notification_log`);
            } catch (logErr) {
                console.error('[SubscriptionActivationService] Failed to log subscription activation in notification_log:', logErr);
            }

            // 1b. Emit real-time socket notification so client updates instantly
            try {
                const { sendNotificationToUser } = await import('./messagingSocket');
                sendNotificationToUser(user.id, 'subscription.activated', {
                    planName,
                    orderId: order.id,
                    orderNumber: order.order_number
                });

                const { notificationService } = await import('./NotificationService');
                const unreadCount = await notificationService.getUnreadCount(user.id);
                sendNotificationToUser(user.id, 'notification:count', { count: unreadCount });
                sendNotificationToUser(user.id, 'notification:updated', {
                    type: 'subscription_activated'
                });

                console.log(`[SubscriptionActivationService] Real-time socket event sent to user ${user.id}`);
            } catch (socketErr) {
                console.error('[SubscriptionActivationService] Failed to emit socket event:', socketErr);
            }

            // 2. Generate invoice (or fetch existing)
            let invoicePdfData: Buffer | null = null;
            try {
                const { InvoiceService } = await import('./InvoiceService');
                const invoice = await InvoiceService.generateInvoice(orderId);
                if (invoice?.pdf_data) {
                    invoicePdfData = Buffer.from(invoice.pdf_data);
                }
            } catch (invErr) {
                console.error('[SubscriptionActivationService] Invoice generation failed:', invErr);
            }

            // 3. Send confirmation email with invoice PDF attached
            try {
                const { sendEmail } = await import('../utils/email');
                const billingCycleLabel = order.plan_type === 'yearly' ? 'Yearly' : 'Monthly';
                const startStr = order.subscription_start_date ? new Date(order.subscription_start_date).toLocaleDateString('en-IN') : 'Today';
                const endStr = order.subscription_end_date ? new Date(order.subscription_end_date).toLocaleDateString('en-IN') : 'N/A';

                const emailHtml = `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;">
                    <div style="background: linear-gradient(135deg, #120865 0%, #6d5efc 100%); padding: 32px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                      <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Subscription Activated!</h1>
                      <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Welcome to ${planName}</p>
                    </div>
                    <div style="background: white; padding: 24px; border-radius: 8px; margin-bottom: 16px;">
                      <p style="margin: 0 0 12px; color: #374151;">Hi <strong>${displayName}</strong>,</p>
                      <p style="margin: 0 0 16px; color: #374151;">Your <strong>${planName}</strong> plan has been successfully activated. Here are your subscription details:</p>
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Plan</td>
                          <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right;">${planName}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Billing Cycle</td>
                          <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right;">${billingCycleLabel}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Valid From</td>
                          <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right;">${startStr}</td>
                        </tr>
                        <tr style="border-bottom: 1px solid #e5e7eb;">
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Valid Until</td>
                          <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right;">${endStr}</td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; color: #6b7280; font-size: 14px;">Order Number</td>
                          <td style="padding: 10px 0; color: #111827; font-weight: 600; text-align: right;">${order.order_number}</td>
                        </tr>
                      </table>
                    </div>
                    <p style="color: #6b7280; font-size: 13px; text-align: center; margin: 0;">
                      ${invoicePdfData ? 'Your tax invoice is attached to this email.' : ''} Thank you for subscribing to Samaagum!
                    </p>
                  </div>
                `;

                const emailAttachments = invoicePdfData
                    ? [{ filename: `Invoice-${order.order_number}.pdf`, content: invoicePdfData }]
                    : undefined;

                await sendEmail({
                    to: emailTo,
                    subject: `✅ ${planName} Subscription Activated – Invoice ${order.order_number}`,
                    html: emailHtml,
                    attachments: emailAttachments
                });
                console.log(`[SubscriptionActivationService] Activation email sent to ${emailTo}`);
            } catch (emailErr) {
                console.error('[SubscriptionActivationService] Failed to send activation email:', emailErr);
            }
        } catch (err) {
            console.error('[SubscriptionActivationService] notifyAndSendInvoice error:', err);
        }
    }

    /**
     * Switches the user's active subscription to a previously purchased, unexpired plan.
     */
    static async switchPlan(orderId: string): Promise<boolean> {
        console.log(`Subscription switch started for order: ${orderId}`);
        try {
            const result = await prisma.$transaction(async (tx) => {
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
                        data: { state: 'cancelled', updated_at: new Date() }
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
            if (result) {
                const order = await prisma.subscription_orders.findUnique({
                    where: { id: orderId },
                    include: { admin_subscription_plans: true }
                });
                if (order) {
                    PlanEntitlementService.invalidate(order.user_id);
                    try {
                        const { sendNotificationToUser } = await import('./messagingSocket');
                        sendNotificationToUser(order.user_id, 'entitlements.updated', {
                            planName: order.admin_subscription_plans?.display_name || 'Plan'
                        });
                        sendNotificationToUser(order.user_id, 'subscription.activated', {
                            planName: order.admin_subscription_plans?.display_name || 'Plan',
                            orderId: order.id,
                            orderNumber: order.order_number
                        });
                    } catch (e) {}
                }
            }
            return result;
        } catch (err) {
            console.error('[SubscriptionActivationService] Error switching plan:', err);
            return false;
        }
    }

    /**
     * Assigns the default plan (is_default=true) to a newly registered user.
     * Creates entity + subscription records so the user has a concrete plan from day 1.
     * Safe to call fire-and-forget — all errors are caught internally.
     */
    static async assignDefaultPlanToUser(userId: string, tenantId: string = '00000000-0000-0000-0000-000000000000'): Promise<void> {
        try {
            const { getDefaultPlan } = await import('../controllers/adminSubscriptionPlanRoutes');
            const defaultAdminPlan = await getDefaultPlan();
            if (!defaultAdminPlan) {
                console.warn(`[assignDefaultPlanToUser] No default plan found — skipping for user ${userId}`);
                return;
            }

            const planNameLower = defaultAdminPlan.name.toLowerCase();

            // Ensure a core plan record exists
            let corePlan = await prisma.plans.findUnique({ where: { key: planNameLower } });
            if (!corePlan) {
                corePlan = await prisma.plans.create({
                    data: {
                        key: planNameLower,
                        plan_type: defaultAdminPlan.plan_type || 'free',
                        version: 1,
                        entitlements: defaultAdminPlan.limits || defaultAdminPlan.features || {},
                        status: 'active'
                    }
                });
            }

            // Ensure entity record exists for this user
            let userEntity = await prisma.entities.findFirst({
                where: { user_id: userId, entity_type: 'user' }
            });
            if (!userEntity) {
                userEntity = await prisma.entities.create({
                    data: {
                        tenant_id: tenantId,
                        entity_type: 'user',
                        user_id: userId,
                        status: 'active',
                        visibility: 'public'
                    }
                });
            }

            // Skip if user already has an active subscription
            const existingActive = await prisma.subscriptions.findFirst({
                where: { owner_entity_id: userEntity.id, state: 'active' }
            });
            if (existingActive) {
                console.log(`[assignDefaultPlanToUser] User ${userId} already has active subscription — skipping.`);
                return;
            }

            // Create a permanent (no expiry) default plan subscription
            await prisma.subscriptions.create({
                data: {
                    tenant_id: tenantId,
                    plan_id: corePlan.id,
                    owner_entity_id: userEntity.id,
                    state: 'active',
                    valid_from: new Date(),
                    valid_to: new Date('2099-12-31T23:59:59Z'), // effectively permanent for free plans
                    created_at: new Date(),
                    updated_at: new Date()
                }
            });

            console.log(`[assignDefaultPlanToUser] Assigned default plan "${defaultAdminPlan.display_name}" to user ${userId}`);
        } catch (err) {
            console.error(`[assignDefaultPlanToUser] Error assigning default plan to user ${userId}:`, err);
        }
    }
}
