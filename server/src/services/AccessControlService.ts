import prisma from '../config/prisma';
import { R_adminResponsibilities } from '../repositories/R_adminResponsibilities';
import { R_adminPositions } from '../repositories/R_adminPositions';
import { R_adminRoles } from '../repositories/R_adminRoles';
import { IAdminResponsibility, IAdminPosition, IAdminRole } from '../repositories';

const respRepo = new R_adminResponsibilities();
const posRepo = new R_adminPositions();
const roleRepo = new R_adminRoles();

export const blockedInheritanceEntities = new Set<string>();

export interface IUserAccessProfile {
    userId: string;
    role: IAdminRole;
    position?: IAdminPosition;
    responsibilities: IAdminResponsibility[];
    accessibleRoutes: string[];
}

export interface IAccessCheckResult {
    hasAccess: boolean;
    responsibility?: IAdminResponsibility;
    message?: string;
}

function roleGrantsCapability(role: any, restrictions: any, capability: string): boolean {
    const capabilities = Array.isArray(role.baseline_capabilities) 
        ? role.baseline_capabilities 
        : (typeof role.baseline_capabilities === 'string' ? JSON.parse(role.baseline_capabilities) : []);
    
    if (!capabilities.includes(capability)) {
        return false;
    }

    if (restrictions) {
        let denyList: string[] = [];
        const parsedRestrictions = typeof restrictions === 'string' ? JSON.parse(restrictions) : restrictions;
        if (parsedRestrictions) {
            if (Array.isArray(parsedRestrictions.deny)) {
                denyList = parsedRestrictions.deny;
            } else if (Array.isArray(parsedRestrictions)) {
                denyList = parsedRestrictions;
            }
        }
        if (denyList.includes(capability)) {
            return false;
        }
    }
    return true;
}

export class AccessControlService {
    async getUserAccessProfile(userId: string, tenantId?: string): Promise<IUserAccessProfile | null> {
        // Find user's role assignment
        const rows = await prisma.$queryRawUnsafe<{ role_id: string }[]>(
            `SELECT role_id FROM role_assignments WHERE user_id = $1::uuid AND (expires_at IS NULL OR expires_at > now()) LIMIT 1`,
            userId
        );
        if (rows.length === 0) return null;

        // Fetch from roles table
        const rolesRow = await prisma.$queryRawUnsafe<{ key: string }[]>(
            `SELECT key FROM roles WHERE id = $1::uuid LIMIT 1`,
            rows[0].role_id
        );
        if (rolesRow.length === 0) return null;

        const roleKey = rolesRow[0].key;
        let adminRoleName = 'admin';
        if (roleKey === 'super_admin') {
            adminRoleName = 'super_admin';
        } else if (roleKey === 'platform_admin' || roleKey === 'admin') {
            adminRoleName = 'admin';
        } else if (roleKey === 'free_user') {
            adminRoleName = 'free_user';
        } else if (roleKey === 'basic_host') {
            adminRoleName = 'basic_host';
        } else if (roleKey === 'pro_host') {
            adminRoleName = 'pro_host';
        } else if (roleKey === 'enterprise_host') {
            adminRoleName = 'enterprise_host';
        }

        const adminRoles = await prisma.$queryRawUnsafe<any[]>(
            `SELECT * FROM admin_roles WHERE name = $1 LIMIT 1`,
            adminRoleName
        );
        if (adminRoles.length === 0) return null;
        const role = adminRoles[0];

        const responsibilityIds: string[] = Array.isArray(role.responsibility_ids) ? role.responsibility_ids : [];
        const responsibilities = responsibilityIds.length > 0
            ? await respRepo.findByIds(responsibilityIds)
            : [];

        const position = role.default_position_id
            ? await posRepo.getById(role.default_position_id) as IAdminPosition | null ?? undefined
            : undefined;

        return {
            userId,
            role,
            position,
            responsibilities,
            accessibleRoutes: responsibilities.map(r => r.route_path).filter(Boolean)
        };
    }

    async checkRouteAccess(userId: string, routePath: string): Promise<IAccessCheckResult> {
        const responsibility = await respRepo.findOne({ route_path: routePath, is_active: true }) as IAdminResponsibility | null;
        if (!responsibility) return { hasAccess: true };

        const profile = await this.getUserAccessProfile(userId);
        if (!profile) return { hasAccess: false, message: 'User has no role assigned' };

        const hasAccess = profile.accessibleRoutes.includes(routePath);
        return hasAccess
            ? { hasAccess: true, responsibility }
            : { hasAccess: false, responsibility, message: `Access denied: requires ${responsibility.display_name}` };
    }

    async hasResponsibilityAccess(userId: string, responsibilityName: string): Promise<boolean> {
        const profile = await this.getUserAccessProfile(userId);
        if (!profile) return false;
        return profile.responsibilities.some(r => r.name === responsibilityName.toLowerCase());
    }

    async hasCapability(userId: string, capability: string, targetEntityId?: string | null): Promise<boolean> {
        // Step 1: Suspension
        const userRows = await prisma.$queryRawUnsafe<{ state: string }[]>(
            `SELECT state FROM users WHERE id = $1::uuid LIMIT 1`,
            userId
        );
        if (userRows.length === 0) {
            console.warn(`[RBAC DENY] User ${userId} not found.`);
            return false;
        }
        if (userRows[0].state === 'suspended' || userRows[0].state === 'deleted') {
            console.warn(`[RBAC DENY] User ${userId} is suspended or deleted.`);
            return false;
        }

        // Step 2: Platform Admin Bypass
        // Fetch all active platform-level role assignments
        const platformAssignments = await prisma.$queryRawUnsafe<{ key: string }[]>(
            `SELECT r.key FROM role_assignments ra
             JOIN roles r ON r.id = ra.role_id
             WHERE ra.user_id = $1::uuid
               AND r.level = 'platform'
               AND (ra.expires_at IS NULL OR ra.expires_at > now())`,
            userId
        );
        if (platformAssignments.length > 0) {
            return true;
        }

        // Step 3: Ownership Carve-out
        if (targetEntityId) {
            const entityRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
                `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
                targetEntityId
            );
            if (entityRows.length > 0) {
                const entity = entityRows[0];
                if (entity.user_id === userId) {
                    return true;
                }
            } else {
                // If not an entity, check if it's an event
                const eventRows = await prisma.$queryRawUnsafe<{ hosted_by_entity_id: string }[]>(
                    `SELECT hosted_by_entity_id FROM events WHERE id = $1::uuid LIMIT 1`,
                    targetEntityId
                );
                if (eventRows.length > 0) {
                    const hostEntityId = eventRows[0].hosted_by_entity_id;
                    const hostRows = await prisma.$queryRawUnsafe<{ user_id: string }[]>(
                        `SELECT user_id FROM entities WHERE id = $1::uuid LIMIT 1`,
                        hostEntityId
                    );
                    if (hostRows.length > 0 && hostRows[0].user_id === userId) {
                        return true;
                    }
                }
            }
        }

        // Step 4: Direct Assignment
        if (targetEntityId) {
            const directAssignments = await prisma.$queryRawUnsafe<{ baseline_capabilities: any; restrictions: any }[]>(
                `SELECT r.baseline_capabilities, ra.restrictions FROM role_assignments ra
                 JOIN roles r ON r.id = ra.role_id
                 WHERE ra.user_id = $1::uuid
                   AND ra.scope_entity_id = $2::uuid
                   AND (ra.expires_at IS NULL OR ra.expires_at > now())`,
                userId, targetEntityId
            );
            for (const da of directAssignments) {
                if (roleGrantsCapability(da, da.restrictions, capability)) {
                    return true;
                }
            }
        }

        // Step 5: Inheritance
        if (targetEntityId) {
            let currentEntityId: string | null = targetEntityId;
            while (currentEntityId) {
                if (blockedInheritanceEntities.has(currentEntityId)) {
                    break; // Block inheritance traversal
                }

                const parentEntityRows: any[] = await prisma.$queryRawUnsafe(
                    `SELECT parent_entity_id FROM entities WHERE id = $1::uuid LIMIT 1`,
                    currentEntityId
                );
                if (parentEntityRows.length === 0) break;

                const parentId = parentEntityRows[0].parent_entity_id;
                if (!parentId) break;

                if (blockedInheritanceEntities.has(parentId)) {
                    break; // Parent blocks inheritance
                }

                currentEntityId = parentId;

                const parentAssignments = await prisma.$queryRawUnsafe<{ baseline_capabilities: any; restrictions: any }[]>(
                    `SELECT r.baseline_capabilities, ra.restrictions FROM role_assignments ra
                     JOIN roles r ON r.id = ra.role_id
                     WHERE ra.user_id = $1::uuid
                       AND ra.scope_entity_id = $2::uuid
                       AND (ra.expires_at IS NULL OR ra.expires_at > now())`,
                    userId, currentEntityId
                );
                for (const pa of parentAssignments) {
                    if (roleGrantsCapability(pa, pa.restrictions, capability)) {
                        return true;
                    }
                }
            }
        }

        // Step 6: Participation Baselines
        const memberRoleRows = await prisma.$queryRawUnsafe<{ baseline_capabilities: any }[]>(
            `SELECT baseline_capabilities FROM roles WHERE key = 'member' LIMIT 1`
        );
        if (memberRoleRows.length > 0) {
            const memberRole = memberRoleRows[0];
            if (roleGrantsCapability(memberRole, null, capability)) {
                if (targetEntityId) {
                    // Check if entity is public/community
                    const entityRows = await prisma.$queryRawUnsafe<{ visibility: string }[]>(
                        `SELECT visibility FROM entities WHERE id = $1::uuid LIMIT 1`,
                        targetEntityId
                    );
                    if (entityRows.length > 0 && (entityRows[0].visibility === 'public' || entityRows[0].visibility === 'community')) {
                        return true;
                    }

                    // Check if user is an active member
                    const memberRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
                        `SELECT id FROM group_memberships
                         WHERE user_id = $1::uuid
                           AND group_id = $2::uuid
                           AND state = 'active'
                         LIMIT 1`,
                        userId, targetEntityId
                    );
                    if (memberRows.length > 0) {
                        return true;
                    }
                }
            }
        }

        // Step 7: Default DENY
        console.warn(`[RBAC DENY] User ${userId} denied capability "${capability}" on entity ${targetEntityId}`);
        return false;
    }
}

export default new AccessControlService();
