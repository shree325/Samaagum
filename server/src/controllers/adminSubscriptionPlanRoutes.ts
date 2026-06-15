import { Router, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { R_adminSubscriptionPlans } from '../repositories/R_adminSubscriptionPlans';
import { R_adminRoles } from '../repositories/R_adminRoles';
import { R_adminPositions } from '../repositories/R_adminPositions';

type Middleware = (req: any, res: Response, next: NextFunction) => void;

export function createSubscriptionPlanRouter(authenticate: Middleware, requireAdmin: Middleware): Router {
    const router = Router();
    const planRepo = new R_adminSubscriptionPlans();
    const roleRepo = new R_adminRoles();
    const posRepo = new R_adminPositions();

    // GET /plans — admin list
    router.get('/plans', authenticate, requireAdmin, async (req: any, res: Response) => {
        try {
            const { search, isActive, category, planType } = req.query;
            let sql = `SELECT * FROM admin_subscription_plans WHERE 1=1`;
            const params: any[] = [];
            let i = 1;
            if (search) { sql += ` AND (name ILIKE $${i} OR display_name ILIKE $${i})`; params.push(`%${search}%`); i++; }
            if (isActive !== undefined) { sql += ` AND is_active = $${i}`; params.push(isActive === 'true'); i++; }
            if (category) { sql += ` AND category = $${i}`; params.push(category); i++; }
            if (planType) { sql += ` AND plan_type = $${i}`; params.push(planType); i++; }
            sql += ` ORDER BY CASE WHEN jsonb_typeof(pricing->'monthly') = 'object' THEN (pricing->'monthly'->>'amount')::numeric WHEN jsonb_typeof(pricing->'monthly') = 'number' THEN (pricing->>'monthly')::numeric ELSE NULL END ASC NULLS LAST`;
            const plans = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
            res.json({ success: true, data: { plans } });
        } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
    });

    // GET /plans/public — no auth, for pricing pages
    router.get('/plans/public', async (_req, res: Response) => {
        try {
            const plans = await planRepo.findPublic();
            res.json({ success: true, data: { plans } });
        } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
    });

    // GET /plans/roles/available — for RBAC dropdown
    router.get('/plans/roles/available', authenticate, requireAdmin, async (_req, res: Response) => {
        try {
            const roles = await roleRepo.findAll({ is_active: true });
            res.json({ success: true, data: { roles } });
        } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
    });

    // GET /plans/positions/available — for RBAC dropdown
    router.get('/plans/positions/available', authenticate, requireAdmin, async (_req, res: Response) => {
        try {
            const positions = await posRepo.findActive();
            res.json({ success: true, data: { positions } });
        } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
    });

    // GET /plans/:id
    router.get('/plans/:id', authenticate, requireAdmin, async (req: any, res: Response) => {
        try {
            const plan = await planRepo.getById(req.params.id);
            if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
            const role = plan.rbac_role_id ? await roleRepo.getById(plan.rbac_role_id) : null;
            const position = plan.rbac_position_id ? await posRepo.getById(plan.rbac_position_id) : null;
            res.json({ success: true, data: { ...plan, rbac: { assignedRole: role, assignedPosition: position, autoAssignRole: plan.rbac_auto_assign } } });
        } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
    });

    // POST /plans
    router.post('/plans', authenticate, requireAdmin, async (req: any, res: Response) => {
        try {
            const { name, displayName, description, category = 'individual', planType = 'monthly', isActive = true, isPopular = false, groupName, pricing = {}, features = [], limits = [], metadata = {}, trial, visibility = {}, rbac = {} } = req.body;
            if (!name || !displayName) return res.status(400).json({ success: false, message: 'name and displayName required' });
            const existing = await planRepo.findOne({ name: name.toLowerCase() });
            if (existing) return res.status(400).json({ success: false, message: 'Plan name already exists' });
            const plan = await planRepo.create({
                name: name.toLowerCase(), display_name: displayName, description,
                category, plan_type: planType, is_active: isActive, is_popular: isPopular,
                group_name: groupName || null, pricing, features, limits, metadata,
                trial: trial || null, visibility,
                rbac_role_id: rbac.assignedRole || null,
                rbac_position_id: rbac.assignedPosition || null,
                rbac_auto_assign: rbac.autoAssignRole || false,
                tenant_id: req.user?.tenantId || null
            });
            res.status(201).json({ success: true, data: plan, message: 'Subscription plan created' });
        } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
    });

    // PUT /plans/:id
    router.put('/plans/:id', authenticate, requireAdmin, async (req: any, res: Response) => {
        try {
            const plan = await planRepo.getById(req.params.id);
            if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
            const { displayName, description, category, planType, isActive, isPopular, groupName, pricing, features, limits, metadata, trial, visibility, rbac } = req.body;
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
            const updated = await planRepo.update(req.params.id, update);
            res.json({ success: true, data: updated, message: 'Subscription plan updated' });
        } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
    });

    // DELETE /plans/:id
    router.delete('/plans/:id', authenticate, requireAdmin, async (req: any, res: Response) => {
        try {
            const plan = await planRepo.getById(req.params.id);
            if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
            const count = await planRepo.countActiveSubscribers(req.params.id);
            if (count > 0) return res.status(400).json({ success: false, message: `Cannot delete: ${count} active subscriber(s)` });
            await planRepo.delete(req.params.id);
            res.json({ success: true, message: 'Subscription plan deleted' });
        } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
    });

    return router;
}

export default createSubscriptionPlanRouter;
