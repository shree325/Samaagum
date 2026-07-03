import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';
import { R_adminSubscriptionPlans } from '../repositories/R_adminSubscriptionPlans';
import { R_adminRoles } from '../repositories/R_adminRoles';
import { R_adminPositions } from '../repositories/R_adminPositions';

/**
 * Returns the currently active default plan (is_default = true).
 * Falls back to the lowest-priced free plan, then null.
 */
export async function getDefaultPlan(): Promise<any | null> {
    try {
        const defaultPlan = await prisma.admin_subscription_plans.findFirst({
            where: { is_default: true, is_active: true }
        });
        if (defaultPlan) return defaultPlan;
        // Fallback: first free/zero-price plan
        const freePlan = await prisma.admin_subscription_plans.findFirst({
            where: { plan_type: 'free', is_active: true }
        });
        return freePlan || null;
    } catch (e) {
        console.error('[getDefaultPlan] Error:', e);
        return null;
    }
}

export const subscriptionPlanRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const planRepo = new R_adminSubscriptionPlans();
    const roleRepo = new R_adminRoles();
    const posRepo = new R_adminPositions();

    // GET /plans — admin list (default plan sorted first)
    fastify.get('/plans', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { search, isActive, category, planType } = request.query as any;
            let sql = `SELECT * FROM admin_subscription_plans WHERE 1=1`;
            const params: any[] = [];
            let i = 1;
            if (search) { sql += ` AND (name ILIKE $${i} OR display_name ILIKE $${i})`; params.push(`%${search}%`); i++; }
            if (isActive !== undefined) { sql += ` AND is_active = $${i}`; params.push(isActive === 'true'); i++; }
            if (category) { sql += ` AND category = $${i}`; params.push(category); i++; }
            if (planType) { sql += ` AND plan_type = $${i}`; params.push(planType); i++; }
            sql += ` ORDER BY is_default DESC, CASE WHEN jsonb_typeof(pricing->'monthly') = 'object' THEN (pricing->'monthly'->>'amount')::numeric WHEN jsonb_typeof(pricing->'monthly') = 'number' THEN (pricing->>'monthly')::numeric ELSE NULL END ASC NULLS LAST`;
            const plans = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
            return { success: true, data: { plans } };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // GET /plans/public — no auth, for pricing pages
    fastify.get('/plans/public', async (request, reply) => {
        try {
            const plans = await planRepo.findPublic();
            return { success: true, data: { plans } };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // GET /plans/roles/available
    fastify.get('/plans/roles/available', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const roles = await roleRepo.findAll({ is_active: true });
            return { success: true, data: { roles } };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // GET /plans/positions/available
    fastify.get('/plans/positions/available', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const positions = await posRepo.findActive();
            return { success: true, data: { positions } };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // GET /plans/:id
    fastify.get('/plans/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const plan = await planRepo.getById(request.params.id);
            if (!plan) return reply.status(404).send({ success: false, message: 'Plan not found' });
            const role = plan.rbac_role_id ? await roleRepo.getById(plan.rbac_role_id) : null;
            const position = plan.rbac_position_id ? await posRepo.getById(plan.rbac_position_id) : null;
            return { success: true, data: { ...plan, rbac: { assignedRole: role, assignedPosition: position, autoAssignRole: plan.rbac_auto_assign } } };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // POST /plans — create
    fastify.post('/plans', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const {
                name, displayName, description, category = 'individual', planType = 'monthly',
                isActive = true, isPopular = false, isDefault = false,
                groupName, pricing = {}, features = [], limits = [], metadata = {},
                trial, visibility = {}, rbac = {}
            } = request.body as any;

            if (!name || !displayName) return reply.status(400).send({ success: false, message: 'name and displayName required' });
            const existing = await planRepo.findOne({ name: name.toLowerCase() });
            if (existing) return reply.status(400).send({ success: false, message: 'Plan name already exists' });

            // Clear previous default if this one is being set as default
            if (isDefault) {
                await prisma.admin_subscription_plans.updateMany({
                    where: { is_default: true },
                    data: { is_default: false, updated_at: new Date() }
                });
            }

            const plan = await planRepo.create({
                name: name.toLowerCase(), display_name: displayName, description,
                category, plan_type: planType, is_active: isActive, is_popular: isPopular,
                is_default: isDefault,
                group_name: groupName || null, pricing, features, limits, metadata,
                trial: trial || null, visibility,
                rbac_role_id: rbac.assignedRole || null,
                rbac_position_id: rbac.assignedPosition || null,
                rbac_auto_assign: rbac.autoAssignRole || false,
                tenant_id: request.user?.tenantId || null
            });
            return reply.status(201).send({ success: true, data: plan, message: 'Subscription plan created' });
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // PUT /plans/:id — update
    fastify.put('/plans/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const plan = await planRepo.getById(request.params.id);
            if (!plan) return reply.status(404).send({ success: false, message: 'Plan not found' });

            const {
                displayName, description, category, planType, isActive, isPopular, isDefault,
                groupName, pricing, features, limits, metadata, trial, visibility, rbac
            } = request.body as any;

            const update: any = { updated_at: new Date() };
            if (displayName !== undefined) update.display_name = displayName;
            if (description !== undefined) update.description = description;
            if (category !== undefined) update.category = category;
            if (planType !== undefined) update.plan_type = planType;
            if (isActive !== undefined) update.is_active = isActive;
            if (isPopular !== undefined) update.is_popular = isPopular;
            if (groupName !== undefined) update.group_name = groupName;
            if (pricing !== undefined) update.pricing = pricing;
            if (features !== undefined) update.features = features;
            if (limits !== undefined) update.limits = limits;
            if (metadata !== undefined) update.metadata = metadata;
            if (trial !== undefined) update.trial = trial;
            if (visibility !== undefined) update.visibility = visibility;
            if (rbac !== undefined) {
                if (rbac.assignedRole !== undefined) update.rbac_role_id = rbac.assignedRole || null;
                if (rbac.assignedPosition !== undefined) update.rbac_position_id = rbac.assignedPosition || null;
                if (rbac.autoAssignRole !== undefined) update.rbac_auto_assign = rbac.autoAssignRole;
            }

            // Handle default switching atomically
            if (isDefault === true) {
                await prisma.admin_subscription_plans.updateMany({
                    where: { is_default: true, id: { not: request.params.id } },
                    data: { is_default: false, updated_at: new Date() }
                });
                update.is_default = true;
            } else if (isDefault === false) {
                update.is_default = false;
            }

            const updated = await planRepo.update(request.params.id, update);

            if (features !== undefined || limits !== undefined) {
                // Mirror to core plans table
                const corePlan = await prisma.plans.findUnique({ where: { key: plan.name.toLowerCase() } });
                if (corePlan) {
                    await prisma.plans.update({
                        where: { id: corePlan.id },
                        data: {
                            entitlements: limits !== undefined ? limits : (features !== undefined ? features : {})
                        }
                    });
                }

                const { PlanEntitlementService } = require('../services/PlanEntitlementService');
                PlanEntitlementService.clearCache();

                // Find all users who are on this plan
                let userIds: string[] = [];
                if (plan.name.toLowerCase() === 'free') {
                    const nonFreePlans = await prisma.plans.findMany({
                        where: { NOT: { key: 'free' } },
                        select: { id: true }
                    });
                    const nonFreePlanIds = nonFreePlans.map(p => p.id);

                    const activeNonFreeSubs = await prisma.subscriptions.findMany({
                        where: {
                            plan_id: { in: nonFreePlanIds },
                            state: 'active'
                        },
                        select: {
                            entities: { select: { user_id: true } }
                        }
                    });
                    const activeNonFreeUserIds = new Set(activeNonFreeSubs.map(s => s.entities?.user_id).filter(Boolean) as string[]);

                    const allUsers = await prisma.users.findMany({ select: { id: true } });
                    userIds = allUsers.map(u => u.id).filter(id => !activeNonFreeUserIds.has(id));
                } else if (corePlan) {
                    const activeSubs = await prisma.subscriptions.findMany({
                        where: {
                            plan_id: corePlan.id,
                            state: 'active'
                        },
                        include: {
                            entities: { select: { user_id: true } }
                        }
                    });
                    userIds = activeSubs.map(sub => sub.entities?.user_id).filter(Boolean) as string[];
                }

                try {
                    const { sendNotificationToUser } = require('../services/messagingSocket');
                    userIds.forEach(uid => {
                        sendNotificationToUser(uid, 'entitlements.updated', {
                            planName: displayName || plan.display_name,
                            entitlements: limits !== undefined ? limits : (features !== undefined ? features : {})
                        });
                    });
                } catch (socketErr) {
                    console.error('[adminSubscriptionPlanRoutes] Failed to emit entitlements.updated socket events:', socketErr);
                }
            }

            return { success: true, data: updated, message: 'Subscription plan updated' };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // PUT /plans/:id/set-default — Atomically promote a plan as the default for new users
    fastify.put('/plans/:id/set-default', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const plan = await planRepo.getById(id);
            if (!plan) return reply.status(404).send({ success: false, message: 'Plan not found' });

            await prisma.$transaction([
                prisma.admin_subscription_plans.updateMany({
                    where: { is_default: true },
                    data: { is_default: false, updated_at: new Date() }
                }),
                prisma.admin_subscription_plans.update({
                    where: { id },
                    data: { is_default: true, updated_at: new Date() }
                })
            ]);

            return { success: true, message: `"${plan.display_name}" is now the default plan for all new users.` };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // PUT /plans/:id/entitlements — update entitlement config
    fastify.put('/plans/:id/entitlements', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { id } = request.params as any;
            const { entitlements } = request.body as any;
            if (!entitlements) return reply.status(400).send({ success: false, message: 'entitlements object is required' });

            const adminPlan = await prisma.admin_subscription_plans.findUnique({ where: { id } });
            if (!adminPlan) return reply.status(404).send({ success: false, message: 'Admin subscription plan not found' });

            const updatedAdminPlan = await prisma.admin_subscription_plans.update({
                where: { id },
                data: { limits: entitlements, updated_at: new Date() }
            });

            // Mirror to core plans table
            const corePlan = await prisma.plans.findUnique({ where: { key: adminPlan.name.toLowerCase() } });
            if (corePlan) {
                await prisma.plans.update({ where: { id: corePlan.id }, data: { entitlements } });
            }

            const { PlanEntitlementService } = require('../services/PlanEntitlementService');
            PlanEntitlementService.clearCache();

            // Find all users who are on this plan
            let userIds: string[] = [];
            if (adminPlan.name.toLowerCase() === 'free') {
                const nonFreePlans = await prisma.plans.findMany({
                    where: { NOT: { key: 'free' } },
                    select: { id: true }
                });
                const nonFreePlanIds = nonFreePlans.map(p => p.id);

                const activeNonFreeSubs = await prisma.subscriptions.findMany({
                    where: {
                        plan_id: { in: nonFreePlanIds },
                        state: 'active'
                    },
                    select: {
                        entities: { select: { user_id: true } }
                    }
                });
                const activeNonFreeUserIds = new Set(activeNonFreeSubs.map(s => s.entities?.user_id).filter(Boolean) as string[]);

                const allUsers = await prisma.users.findMany({ select: { id: true } });
                userIds = allUsers.map(u => u.id).filter(id => !activeNonFreeUserIds.has(id));
            } else if (corePlan) {
                const activeSubs = await prisma.subscriptions.findMany({
                    where: {
                        plan_id: corePlan.id,
                        state: 'active'
                    },
                    include: {
                        entities: { select: { user_id: true } }
                    }
                });
                userIds = activeSubs.map(sub => sub.entities?.user_id).filter(Boolean) as string[];
            }

            try {
                const { sendNotificationToUser } = require('../services/messagingSocket');
                userIds.forEach(uid => {
                    sendNotificationToUser(uid, 'entitlements.updated', {
                        planName: adminPlan.display_name,
                        entitlements
                    });
                });
            } catch (socketErr) {
                console.error('[adminSubscriptionPlanRoutes] Failed to emit entitlements.updated socket events:', socketErr);
            }

            return { success: true, data: updatedAdminPlan, message: 'Plan entitlements updated successfully' };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // DELETE /plans/:id
    fastify.delete('/plans/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const plan = await planRepo.getById(request.params.id);
            if (!plan) return reply.status(404).send({ success: false, message: 'Plan not found' });
            if (plan.is_default) return reply.status(400).send({ success: false, message: 'Cannot delete the default plan. Set another plan as default first.' });
            const count = await planRepo.countActiveSubscribers(request.params.id);
            if (count > 0) return reply.status(400).send({ success: false, message: `Cannot delete: ${count} active subscriber(s)` });
            await planRepo.delete(request.params.id);
            return { success: true, message: 'Subscription plan deleted' };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });
};

export default subscriptionPlanRoutes;
