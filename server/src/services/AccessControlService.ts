import prisma from '../config/prisma';
import { R_adminResponsibilities } from '../repositories/R_adminResponsibilities';
import { R_adminPositions } from '../repositories/R_adminPositions';
import { R_adminRoles } from '../repositories/R_adminRoles';
import { R_roleAssignments } from '../repositories/R_roleAssignments';
import { R_roles } from '../repositories/R_roles';
import { R_users } from '../repositories/R_users';
import { R_entities } from '../repositories/R_entities';
import { R_events } from '../repositories/R_events';
import { R_group_memberships } from '../repositories/R_group_memberships';
import { IAdminResponsibility, IAdminPosition, IAdminRole } from '../repositories';

const respRepo = new R_adminResponsibilities();
const posRepo = new R_adminPositions();
const adminRolesRepo = new R_adminRoles();
const roleAssignmentsRepo = new R_roleAssignments();
const rolesRepo = new R_roles();
const usersRepo = new R_users(prisma);
const entitiesRepo = new R_entities(prisma);
const eventsRepo = new R_events(prisma);
const groupMembershipsRepo = new R_group_memberships();

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
        const roleId = await roleAssignmentsRepo.getActiveRoleAssignment(userId);
        if (!roleId) return null;

        // Fetch from roles table
        const roleKey = await rolesRepo.getRoleKey(roleId);
        if (!roleKey) return null;

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

        const role = await adminRolesRepo.findByName(adminRoleName);
        if (!role) return null;

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
        const userState = await usersRepo.getUserState(userId);
        if (!userState) {
            console.warn(`[RBAC DENY] User ${userId} not found.`);
            return false;
        }
        if (userState === 'suspended' || userState === 'deleted') {
            console.warn(`[RBAC DENY] User ${userId} is suspended or deleted.`);
            return false;
        }

        // Step 2: Platform Admin Bypass
        // Fetch all active platform-level role assignments
        const platformRoleKeys = await roleAssignmentsRepo.getPlatformRoleKeysForUser(userId);
        if (platformRoleKeys.length > 0) {
            return true;
        }

        // Step 3: Ownership Carve-out
        if (targetEntityId) {
            const entityOwnerUserId = await entitiesRepo.getOwnerUserId(targetEntityId);
            if (entityOwnerUserId) {
                if (entityOwnerUserId === userId) {
                    return true;
                }
            } else {
                // If not an entity, check if it's an event
                const hostEntityId = await eventsRepo.getHostedByEntityId(targetEntityId);
                if (hostEntityId) {
                    const hostOwnerUserId = await entitiesRepo.getOwnerUserId(hostEntityId);
                    if (hostOwnerUserId === userId) {
                        return true;
                    }
                }
            }
        }

        // Step 4: Direct Assignment
        if (targetEntityId) {
            const directAssignments = await roleAssignmentsRepo.getDirectAssignments(userId, targetEntityId);
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

                const parentId = await entitiesRepo.getParentEntityId(currentEntityId);
                if (!parentId) break;

                if (blockedInheritanceEntities.has(parentId)) {
                    break; // Parent blocks inheritance
                }

                currentEntityId = parentId;

                const parentAssignments = await roleAssignmentsRepo.getDirectAssignments(userId, currentEntityId);
                for (const pa of parentAssignments) {
                    if (roleGrantsCapability(pa, pa.restrictions, capability)) {
                        return true;
                    }
                }
            }
        }

        // Step 6: Participation Baselines
        const baselineCapabilities = await rolesRepo.getBaselineCapabilitiesByKey('member');
        if (baselineCapabilities) {
            const memberRole = { baseline_capabilities: baselineCapabilities };
            if (roleGrantsCapability(memberRole, null, capability)) {
                if (targetEntityId) {
                    // Check if entity is public/community
                    const entityVisibility = await entitiesRepo.getVisibility(targetEntityId);
                    if (entityVisibility === 'public' || entityVisibility === 'community') {
                        return true;
                    }

                    // Check if user is an active member
                    const isMember = await groupMembershipsRepo.isActiveMember(userId, targetEntityId);
                    if (isMember) {
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
