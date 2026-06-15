import prisma from '../config/prisma';
import { R_adminResponsibilities } from '../repositories/R_adminResponsibilities';
import { R_adminPositions } from '../repositories/R_adminPositions';
import { R_adminRoles } from '../repositories/R_adminRoles';
import { IAdminResponsibility, IAdminPosition, IAdminRole } from '../repositories';

const respRepo = new R_adminResponsibilities();
const posRepo = new R_adminPositions();
const roleRepo = new R_adminRoles();

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

export class AccessControlService {
    async getUserAccessProfile(userId: string, tenantId?: string): Promise<IUserAccessProfile | null> {
        // Find user's role assignment
        const rows = await prisma.$queryRawUnsafe<{ role_id: string }[]>(
            `SELECT role_id FROM role_assignments WHERE user_id = $1::uuid AND (expires_at IS NULL OR expires_at > now()) LIMIT 1`,
            userId
        );
        if (rows.length === 0) return null;

        const role = await roleRepo.getById(rows[0].role_id) as IAdminRole | null;
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
}

export default new AccessControlService();
