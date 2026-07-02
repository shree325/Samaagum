import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';
import { R_adminSubscriptionPlans } from '../repositories/R_adminSubscriptionPlans';
import { R_adminRoles } from '../repositories/R_adminRoles';
import { R_adminPositions } from '../repositories/R_adminPositions';

export const subscriptionPlanRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const planRepo = new R_adminSubscriptionPlans();
    const roleRepo = new R_adminRoles();
    const posRepo = new R_adminPositions();

    // GET /plans — admin list
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
            sql += ` ORDER BY CASE WHEN jsonb_typeof(pricing->'monthly') = 'object' THEN (pricing->'monthly'->>'amount')::numeric WHEN jsonb_typeof(pricing->'monthly') = 'number' THEN (pricing->>'monthly')::numeric ELSE NULL END ASC NULLS LAST`;
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

    // GET /plans/roles/available — for RBAC dropdown
    fastify.get('/plans/roles/available', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const roles = await roleRepo.findAll({ is_active: true });
            return { success: true, data: { roles } };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // GET /plans/positions/available — for RBAC dropdown
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

    // POST /plans
    fastify.post('/plans', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { name, displayName, description, category = 'individual', planType = 'monthly', isActive = true, isPopular = false, groupName, pricing = {}, features = [], limits = [], metadata = {}, trial, visibility = {}, rbac = {} } = request.body as any;
            if (!name || !displayName) return reply.status(400).send({ success: false, message: 'name and displayName required' });
            const existing = await planRepo.findOne({ name: name.toLowerCase() });
            if (existing) return reply.status(400).send({ success: false, message: 'Plan name already exists' });
            const plan = await planRepo.create({
                name: name.toLowerCase(), display_name: displayName, description,
                category, plan_type: planType, is_active: isActive, is_popular: isPopular,
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

    // PUT /plans/:id
    fastify.put('/plans/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const plan = await planRepo.getById(request.params.id);
            if (!plan) return reply.status(404).send({ success: false, message: 'Plan not found' });
            const { displayName, description, category, planType, isActive, isPopular, groupName, pricing, features, limits, metadata, trial, visibility, rbac } = request.body as any;
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
            const updated = await planRepo.update(request.params.id, update);
            return { success: true, data: updated, message: 'Subscription plan updated' };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });

    // PUT /plans/:id/entitlements — update plan entitlements config
    fastify.put('/plans/:id/entitlements', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { id } = request.params;
            const { entitlements } = request.body as any;
            if (!entitlements) {
                return reply.status(400).send({ success: false, message: 'entitlements object is required' });
            }

            const adminPlan = await prisma.admin_subscription_plans.findUnique({ where: { id } });
            if (!adminPlan) {
                return reply.status(404).send({ success: false, message: 'Admin subscription plan not found' });
            }

            const updatedAdminPlan = await prisma.admin_subscription_plans.update({
                where: { id },
                data: {
                    limits: entitlements,
                    updated_at: new Date()
                }
            });

            // Mirror to core plans table using key
            const planKey = adminPlan.name.toLowerCase();
            const corePlan = await prisma.plans.findUnique({ where: { key: planKey } });
            if (corePlan) {
                await prisma.plans.update({
                    where: { id: corePlan.id },
                    data: {
                        entitlements
                    }
                });
            }

            // Invalidate the cache
            const { PlanEntitlementService } = require('../services/PlanEntitlementService');
            PlanEntitlementService.clearCache();

            return { success: true, data: updatedAdminPlan, message: 'Plan entitlements updated successfully' };
        } catch (e: any) {
            return reply.status(500).send({ success: false, message: e.message });
        }
    });

    // DELETE /plans/:id
    fastify.delete('/plans/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const plan = await planRepo.getById(request.params.id);
            if (!plan) return reply.status(404).send({ success: false, message: 'Plan not found' });
            const count = await planRepo.countActiveSubscribers(request.params.id);
            if (count > 0) return reply.status(400).send({ success: false, message: `Cannot delete: ${count} active subscriber(s)` });
            await planRepo.delete(request.params.id);
            return { success: true, message: 'Subscription plan deleted' };
        } catch (e: any) { return reply.status(500).send({ success: false, message: e.message }); }
    });
};

export default subscriptionPlanRoutes;
