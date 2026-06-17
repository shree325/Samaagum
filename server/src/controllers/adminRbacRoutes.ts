import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import prisma from '../config/prisma';
import { R_adminResponsibilities } from '../repositories/R_adminResponsibilities';
import { R_adminPositions } from '../repositories/R_adminPositions';
import { R_adminRoles } from '../repositories/R_adminRoles';

export const adminRbacRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const respRepo = new R_adminResponsibilities();
    const posRepo = new R_adminPositions();
    const roleRepo = new R_adminRoles();

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

            // Attach responsibilities for each role
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

            if (isDefault) await roleRepo.clearDefaultForTenant('00000000-0000-0000-0000-000000000000', request.user?.tenantId ?? null);

            const role = await roleRepo.create({
                name: name.toLowerCase(), display_name: displayName, description,
                tenant_id: request.user?.tenantId ?? null, is_system_role: false, is_active: isActive, is_default: isDefault,
                hierarchy_level: hierarchyLevel, responsibility_ids: responsibilities,
                default_position_id: defaultPosition || null, created_by: request.user?.id ?? null
            });
            return reply.status(201).send({ success: true, data: role, message: 'Role created successfully' });
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
            const update: any = {};
            if (displayName !== undefined) update.display_name = displayName;
            if (description !== undefined) update.description = description;
            if (responsibilities !== undefined) update.responsibility_ids = responsibilities;
            if (defaultPosition !== undefined) update.default_position_id = defaultPosition || null;
            if (hierarchyLevel !== undefined) update.hierarchy_level = hierarchyLevel;
            if (isActive !== undefined) update.is_active = isActive;
            if (isDefault !== undefined) {
                update.is_default = isDefault;
                if (isDefault) await roleRepo.clearDefaultForTenant(request.params.id, role.tenant_id ?? null);
            }
            update.updated_at = new Date();

            const updated = await roleRepo.update(request.params.id, update);
            return { success: true, data: updated, message: 'Role updated successfully' };
        } catch {
            return reply.status(500).send({ success: false, message: 'Internal server error' });
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

            // Check if used in any role
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
