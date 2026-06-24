import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';
import { R_adminResponsibilities } from '../repositories/R_adminResponsibilities';
import { R_adminPositions } from '../repositories/R_adminPositions';
import { R_adminRoles } from '../repositories/R_adminRoles';

async function mapResponsibilitiesToCapabilities(respIds: string[]): Promise<string[]> {
    if (!respIds || respIds.length === 0) return [];
    const responsibilities = await prisma.$queryRawUnsafe<{ name: string }[]>(
        `SELECT name FROM admin_responsibilities WHERE id = ANY($1::uuid[])`,
        respIds
    );
    const caps = new Set<string>();
    for (const r of responsibilities) {
        switch (r.name) {
            case 'dashboard_main':
                caps.add('checkin.view');
                break;
            case 'events_management':
                caps.add('event.view');
                caps.add('event.configure_tickets');
                caps.add('event.cancel');
                break;
            case 'groups_management':
                caps.add('group.view');
                caps.add('group.manage');
                break;
            case 'user_management':
                caps.add('user.manage');
                caps.add('user.view');
                break;
            case 'role_management':
            case 'responsibility_management':
            case 'admin_position_management':
                caps.add('rbac.manage');
                break;
            case 'system_settings':
                caps.add('platform.settings');
                break;
        }
    }
    return Array.from(caps);
}

async function validateCapabilitiesSubset(level: string, capabilities: string[]): Promise<{ isValid: boolean; message?: string }> {
    const reservedRole = await prisma.roles.findFirst({
        where: { level: level as any, reserved: true }
    });
    if (!reservedRole) {
        return { isValid: true };
    }
    const baselineCaps = Array.isArray(reservedRole.baseline_capabilities)
        ? reservedRole.baseline_capabilities
        : (typeof reservedRole.baseline_capabilities === 'string' ? JSON.parse(reservedRole.baseline_capabilities) : []);
    
    for (const cap of capabilities) {
        if (!baselineCaps.includes(cap)) {
            return {
                isValid: false,
                message: `Capability "${cap}" is not allowed. It exceeds the baseline capabilities of the "${reservedRole.key}" platform role at level "${level}".`
            };
        }
    }
    return { isValid: true };
}

export const adminRbacRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const respRepo = new R_adminResponsibilities();
    const posRepo = new R_adminPositions();
    const roleRepo = new R_adminRoles();

    // Ensure maker_checker_requests table exists on startup
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS maker_checker_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            action_type VARCHAR(100) NOT NULL,
            payload JSONB NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            maker_user_id UUID NOT NULL REFERENCES users(id),
            checker_user_id UUID REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `);

    // ── ROLES ──────────────────────────────────────────────────────────────

    fastify.get('/roles', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { search, isSystemRole, isActive, isDefault } = request.query as any;
            let sql = `SELECT * FROM admin_roles WHERE 1=1`;
            const params: any[] = [];
            let i = 1;

            if (search) { sql += ` AND (name ILIKE $${i} OR display_name ILIKE $${i})`; params.push(`%${search}%`); i++; }
            if (isSystemRole !== undefined) { sql += ` AND is_system_role = $${i}`; params.push(isSystemRole === 'true'); i++; }
            if (isActive !== undefined) { sql += ` AND is_active = $${i}`; params.push(isActive === 'true'); i++; }
            if (isDefault !== undefined) { sql += ` AND is_default = $${i}`; params.push(isDefault === 'true'); i++; }

            if (request.user?.role !== 'super_admin' && request.user?.tenantId) {
                sql += ` AND (tenant_id = $${i} OR is_system_role = true)`;
                params.push(request.user.tenantId); i++;
            }

            sql += ` ORDER BY hierarchy_level ASC, created_at DESC`;
            const roles = await prisma.$queryRawUnsafe<any[]>(sql, ...params);

            const enriched = await Promise.all(roles.map(async role => {
                const ids: string[] = Array.isArray(role.responsibility_ids) ? role.responsibility_ids : [];
                const responsibilities = ids.length > 0 ? await respRepo.findByIds(ids) : [];
                const position = role.default_position_id ? await posRepo.getById(role.default_position_id) : null;
                return { ...role, responsibilities, position };
            }));

            return { success: true, data: { roles: enriched, total: enriched.length } };
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    fastify.get('/roles/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const role = await roleRepo.getById(request.params.id);
            if (!role) return reply.status(404).send({ success: false, message: 'Role not found' });
            const ids: string[] = Array.isArray(role.responsibility_ids) ? role.responsibility_ids : [];
            const responsibilities = ids.length > 0 ? await respRepo.findByIds(ids) : [];
            const position = role.default_position_id ? await posRepo.getById(role.default_position_id) : null;
            return { success: true, data: { ...role, responsibilities, position } };
        } catch {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    fastify.post('/roles', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { name, displayName, description, responsibilities = [], defaultPosition, hierarchyLevel = 100, isActive = true, isDefault = false } = request.body as any;
            if (!name || !displayName) return reply.status(400).send({ success: false, message: 'name and displayName required' });

            const existing = await roleRepo.findOne({ name: name.toLowerCase(), tenant_id: request.user?.tenantId ?? null });
            if (existing) return reply.status(400).send({ success: false, message: 'Role name already exists' });

            // Enforce Restrict-Only capability checks
            const caps = await mapResponsibilitiesToCapabilities(responsibilities);
            const validation = await validateCapabilitiesSubset('event', caps);
            if (!validation.isValid) {
                return reply.status(400).send({ success: false, message: validation.message });
            }

            // Enforce Maker-Checker flow: Queue the role creation
            await prisma.$executeRawUnsafe(
                `INSERT INTO maker_checker_requests (action_type, payload, maker_user_id, status)
                 VALUES ($1, $2::jsonb, $3::uuid, 'pending')`,
                'CREATE_ROLE',
                JSON.stringify({ name, displayName, description, responsibilities, defaultPosition, hierarchyLevel, isActive, isDefault }),
                request.user.id
            );

            return reply.status(202).send({ success: true, message: 'Role creation request submitted for checker approval' });
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: error.message || 'Internal server error' });
        }
    });

    fastify.put('/roles/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const role = await roleRepo.getById(request.params.id);
            if (!role) return reply.status(404).send({ success: false, message: 'Role not found' });
            if (role.is_system_role && request.user?.role !== 'super_admin') {
                return reply.status(403).send({ success: false, message: 'Cannot modify system roles' });
            }

            const { displayName, description, responsibilities, defaultPosition, hierarchyLevel, isActive, isDefault } = request.body as any;

            // Enforce Restrict-Only capability checks if responsibilities are provided
            if (responsibilities) {
                const caps = await mapResponsibilitiesToCapabilities(responsibilities);
                const validation = await validateCapabilitiesSubset('event', caps);
                if (!validation.isValid) {
                    return reply.status(400).send({ success: false, message: validation.message });
                }
            }

            // Enforce Maker-Checker flow: Queue the role update
            await prisma.$executeRawUnsafe(
                `INSERT INTO maker_checker_requests (action_type, payload, maker_user_id, status)
                 VALUES ($1, $2::jsonb, $3::uuid, 'pending')`,
                'UPDATE_ROLE',
                JSON.stringify({ id: request.params.id, displayName, description, responsibilities, defaultPosition, hierarchyLevel, isActive, isDefault }),
                request.user.id
            );

            return reply.status(202).send({ success: true, message: 'Role modification request submitted for checker approval' });
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: error.message || 'Internal server error' });
        }
    });

    fastify.delete('/roles/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const role = await roleRepo.getById(request.params.id);
            if (!role) return reply.status(404).send({ success: false, message: 'Role not found' });
            if (role.is_system_role) return reply.status(400).send({ success: false, message: 'Cannot delete system roles' });
            if (role.is_default) return reply.status(400).send({ success: false, message: 'Cannot delete default role' });

            const userCount = await roleRepo.countUsersWithRole(request.params.id);
            if (userCount > 0) return reply.status(400).send({ success: false, message: 'Role is assigned to active users' });

            await roleRepo.delete(request.params.id);
            return { success: true, message: 'Role deleted successfully' };
        } catch {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    // ── ROLE ASSIGNMENTS (WITH MAKER-CHECKER) ──────────────────────────────

    fastify.post('/role-assignments', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { userId, roleId, scopeEntityId } = request.body as any;
            if (!userId || !roleId) {
                return reply.status(400).send({ success: false, message: 'userId and roleId are required' });
            }

            // Enforce Maker-Checker flow: Queue the role assignment
            await prisma.$executeRawUnsafe(
                `INSERT INTO maker_checker_requests (action_type, payload, maker_user_id, status)
                 VALUES ($1, $2::jsonb, $3::uuid, 'pending')`,
                'ASSIGN_ROLE',
                JSON.stringify({ userId, roleId, scopeEntityId, tenantId: request.user.tenantId || '00000000-0000-0000-0000-000000000000' }),
                request.user.id
            );

            return reply.status(202).send({ success: true, message: 'Role assignment request submitted for checker approval' });
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    // ── MAKER-CHECKER ENDPOINTS ───────────────────────────────────────────

    fastify.get('/maker-checker/requests', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const requests = await prisma.$queryRawUnsafe<any[]>(
                `SELECT r.*, u.primary_email as maker_email FROM maker_checker_requests r
                 JOIN users u ON u.id = r.maker_user_id
                 ORDER BY r.created_at DESC`
            );
            return { success: true, data: requests };
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    fastify.post('/maker-checker/requests/:id/approve', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const requestId = request.params.id;
            const checkerUserId = request.user.id;

            const reqRows = await prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM maker_checker_requests WHERE id = $1::uuid LIMIT 1`,
                requestId
            );
            if (reqRows.length === 0) return reply.status(404).send({ success: false, message: 'Request not found' });
            const mcReq = reqRows[0];

            if (mcReq.status !== 'pending') {
                return reply.status(400).send({ success: false, message: 'Request is already processed' });
            }

            if (mcReq.maker_user_id === checkerUserId) {
                return reply.status(400).send({ success: false, message: 'Maker and Checker must be different users' });
            }

            const payload = typeof mcReq.payload === 'string' ? JSON.parse(mcReq.payload) : mcReq.payload;

            // Execute the action!
            if (mcReq.action_type === 'CREATE_ROLE') {
                const { name, displayName, description, responsibilities, defaultPosition, hierarchyLevel, isActive, isDefault } = payload;
                
                if (isDefault) {
                    await roleRepo.clearDefaultForTenant('00000000-0000-0000-0000-000000000000', request.user?.tenantId ?? null);
                }

                await roleRepo.create({
                    name: name.toLowerCase(), display_name: displayName, description,
                    tenant_id: request.user?.tenantId ?? null, is_system_role: false, is_active: isActive, is_default: isDefault,
                    hierarchy_level: hierarchyLevel, responsibility_ids: responsibilities,
                    default_position_id: defaultPosition || null, created_by: mcReq.maker_user_id
                });

                const caps = await mapResponsibilitiesToCapabilities(responsibilities);
                await prisma.$executeRawUnsafe(
                    `INSERT INTO roles (id, key, level, phase, reserved, baseline_capabilities)
                     VALUES (gen_random_uuid(), $1, $2::role_level, $3, false, $4::jsonb)
                     ON CONFLICT (key) DO UPDATE SET baseline_capabilities = EXCLUDED.baseline_capabilities`,
                    name.toLowerCase(), 'event', 'MVP', JSON.stringify(caps)
                );

            } else if (mcReq.action_type === 'UPDATE_ROLE') {
                const { id, displayName, description, responsibilities, defaultPosition, hierarchyLevel, isActive, isDefault } = payload;
                const role = await roleRepo.getById(id);
                if (role) {
                    const update: any = {};
                    if (displayName !== undefined) update.display_name = displayName;
                    if (description !== undefined) update.description = description;
                    if (responsibilities !== undefined) update.responsibility_ids = responsibilities;
                    if (defaultPosition !== undefined) update.default_position_id = defaultPosition || null;
                    if (hierarchyLevel !== undefined) update.hierarchy_level = hierarchyLevel;
                    if (isActive !== undefined) update.is_active = isActive;
                    if (isDefault !== undefined) {
                        update.is_default = isDefault;
                        if (isDefault) await roleRepo.clearDefaultForTenant(id, role.tenant_id ?? null);
                    }
                    update.updated_at = new Date();
                    await roleRepo.update(id, update);

                    if (responsibilities) {
                        const caps = await mapResponsibilitiesToCapabilities(responsibilities);
                        await prisma.$executeRawUnsafe(
                            `UPDATE roles SET baseline_capabilities = $1::jsonb WHERE key = $2`,
                            JSON.stringify(caps), role.name
                        );
                    }
                }
            } else if (mcReq.action_type === 'ASSIGN_ROLE') {
                const { userId, roleId, scopeEntityId, tenantId } = payload;
                
                await prisma.$executeRawUnsafe(
                    `INSERT INTO role_assignments (id, tenant_id, user_id, role_id, scope_entity_id, created_at, updated_at)
                     VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, $4::uuid, now(), now())
                     ON CONFLICT (user_id, role_id, scope_entity_id) DO NOTHING`,
                    tenantId, userId, roleId, scopeEntityId || null
                );
            }

            await prisma.$executeRawUnsafe(
                `UPDATE maker_checker_requests SET status = 'approved', checker_user_id = $1::uuid, updated_at = now() WHERE id = $2::uuid`,
                checkerUserId, requestId
            );

            return { success: true, message: 'Request approved and executed successfully' };
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: error.message || 'Internal server error' });
        }
    });

    fastify.post('/maker-checker/requests/:id/reject', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const requestId = request.params.id;
            const checkerUserId = request.user.id;

            const reqRows = await prisma.$queryRawUnsafe<any[]>(
                `SELECT * FROM maker_checker_requests WHERE id = $1::uuid LIMIT 1`,
                requestId
            );
            if (reqRows.length === 0) return reply.status(404).send({ success: false, message: 'Request not found' });
            if (reqRows[0].status !== 'pending') return reply.status(400).send({ success: false, message: 'Request is already processed' });

            await prisma.$executeRawUnsafe(
                `UPDATE maker_checker_requests SET status = 'rejected', checker_user_id = $1::uuid, updated_at = now() WHERE id = $2::uuid`,
                checkerUserId, requestId
            );

            return { success: true, message: 'Request rejected successfully' };
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    // ── RESPONSIBILITIES ───────────────────────────────────────────────────

    fastify.get('/responsibilities', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { search, category, isActive } = request.query as any;
            let sql = `SELECT * FROM admin_responsibilities WHERE 1=1`;
            const params: any[] = [];
            let i = 1;
            if (search) { sql += ` AND (name ILIKE $${i} OR display_name ILIKE $${i})`; params.push(`%${search}%`); i++; }
            if (category) { sql += ` AND category = $${i}`; params.push(category); i++; }
            if (isActive !== undefined) { sql += ` AND is_active = $${i}`; params.push(isActive === 'true'); i++; }
            sql += ` ORDER BY category, sort_order`;
            const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
            return { success: true, data: rows };
        } catch {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    fastify.post('/responsibilities', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { name, displayName, description, category, routePath, componentName, iconName, requiredFeatures = [], sortOrder = 0 } = request.body as any;
            if (!name || !displayName || !routePath || !componentName) return reply.status(400).send({ success: false, message: 'Missing required fields' });

            const existing = await respRepo.findOne({ name: name.toLowerCase() });
            if (existing) return reply.status(400).send({ success: false, message: 'Responsibility name already exists' });

            const resp = await respRepo.create({
                name: name.toLowerCase(), display_name: displayName, description, category,
                route_path: routePath, component_name: componentName, icon_name: iconName || 'Circle',
                required_features: requiredFeatures, sort_order: sortOrder, is_active: true
            });
            return reply.status(201).send({ success: true, data: resp, message: 'Responsibility created successfully' });
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: error.message || 'Internal server error' });
        }
    });

    fastify.put('/responsibilities/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const resp = await respRepo.getById(request.params.id);
            if (!resp) return reply.status(404).send({ success: false, message: 'Responsibility not found' });
            const { displayName, description, category, routePath, componentName, iconName, requiredFeatures, sortOrder, isActive } = request.body as any;
            const update: any = {};
            if (displayName !== undefined) update.display_name = displayName;
            if (description !== undefined) update.description = description;
            if (category !== undefined) update.category = category;
            if (routePath !== undefined) update.route_path = routePath;
            if (componentName !== undefined) update.component_name = componentName;
            if (iconName !== undefined) update.icon_name = iconName;
            if (requiredFeatures !== undefined) update.required_features = requiredFeatures;
            if (sortOrder !== undefined) update.sort_order = sortOrder;
            if (isActive !== undefined) update.is_active = isActive;
            update.updated_at = new Date();
            const updated = await respRepo.update(request.params.id, update);
            return { success: true, data: updated, message: 'Responsibility updated successfully' };
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: error.message || 'Internal server error' });
        }
    });

    fastify.delete('/responsibilities/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const resp = await respRepo.getById(request.params.id);
            if (!resp) return reply.status(404).send({ success: false, message: 'Responsibility not found' });

            const rolesUsing = await prisma.$queryRawUnsafe<{ count: string }[]>(
                `SELECT COUNT(*) as count FROM admin_roles WHERE responsibility_ids @> $1::jsonb`,
                JSON.stringify([request.params.id])
            );
            if (parseInt(rolesUsing[0]?.count || '0') > 0) {
                return reply.status(400).send({ success: false, message: 'Responsibility is linked to active roles' });
            }
            await respRepo.delete(request.params.id);
            return { success: true, message: 'Responsibility deleted successfully' };
        } catch {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    // ── POSITIONS ──────────────────────────────────────────────────────────

    fastify.get('/positions', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { search, isActive } = request.query as any;
            let sql = `SELECT * FROM admin_positions WHERE 1=1`;
            const params: any[] = [];
            let i = 1;
            if (search) { sql += ` AND (name ILIKE $${i} OR display_name ILIKE $${i})`; params.push(`%${search}%`); i++; }
            if (isActive !== undefined) { sql += ` AND is_active = $${i}`; params.push(isActive === 'true'); i++; }
            sql += ` ORDER BY hierarchy_level ASC`;
            const rows = await prisma.$queryRawUnsafe<any[]>(sql, ...params);
            return { success: true, data: rows };
        } catch {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    fastify.post('/positions', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const { name, displayName, description, hierarchyLevel, dataAccessLevel, customConditions = [], dataAccessLimits = {} } = request.body as any;
            if (!name || !displayName || !hierarchyLevel || !dataAccessLevel) return reply.status(400).send({ success: false, message: 'Missing required fields' });

            const existing = await posRepo.findOne({ name: name.toLowerCase() });
            if (existing) return reply.status(400).send({ success: false, message: 'Position name already exists' });

            const position = await posRepo.create({
                name: name.toLowerCase(), display_name: displayName, description,
                hierarchy_level: hierarchyLevel, data_access_level: dataAccessLevel,
                custom_conditions: customConditions, data_access_limits: dataAccessLimits, is_active: true
            });
            return reply.status(201).send({ success: true, data: position, message: 'Position created successfully' });
        } catch (error: any) {
            return reply.status(500).send({ success: false, message: error.message || 'Internal server error' });
        }
    });

    fastify.put('/positions/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const position = await posRepo.getById(request.params.id);
            if (!position) return reply.status(404).send({ success: false, message: 'Position not found' });
            const { displayName, description, hierarchyLevel, dataAccessLevel, customConditions, dataAccessLimits, isActive } = request.body as any;
            const update: any = {};
            if (displayName !== undefined) update.display_name = displayName;
            if (description !== undefined) update.description = description;
            if (hierarchyLevel !== undefined) update.hierarchy_level = hierarchyLevel;
            if (dataAccessLevel !== undefined) update.data_access_level = dataAccessLevel;
            if (customConditions !== undefined) update.custom_conditions = customConditions;
            if (dataAccessLimits !== undefined) update.data_access_limits = dataAccessLimits;
            if (isActive !== undefined) update.is_active = isActive;
            update.updated_at = new Date();
            const updated = await posRepo.update(request.params.id, update);
            return { success: true, data: updated, message: 'Position updated successfully' };
        } catch {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });

    fastify.delete('/positions/:id', { preHandler: [(fastify as any).authenticate, (fastify as any).requireAdmin] }, async (request: any, reply) => {
        try {
            const position = await posRepo.getById(request.params.id);
            if (!position) return reply.status(404).send({ success: false, message: 'Position not found' });

            const rolesUsing = await prisma.$queryRawUnsafe<{ count: string }[]>(
                `SELECT COUNT(*) as count FROM admin_roles WHERE default_position_id = $1::uuid`,
                request.params.id
            );
            if (parseInt(rolesUsing[0]?.count || '0') > 0) {
                return reply.status(400).send({ success: false, message: 'Position is assigned to active roles' });
            }
            await posRepo.delete(request.params.id);
            return { success: true, message: 'Position deleted successfully' };
        } catch {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
        }
    });
};

export default adminRbacRoutes;
