import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IAdminRole, IR_adminRoles } from './IR_adminRoles';

export class R_adminRoles
    extends PostgresBaseRepository<IAdminRole>
    implements IR_adminRoles
{
    constructor() {
        super('admin_roles', 'id');
    }

    async findByTenant(tenantId: string | null): Promise<IAdminRole[]> {
        const rows = tenantId
            ? await prisma.$queryRawUnsafe<IAdminRole[]>(
                `SELECT * FROM admin_roles WHERE (tenant_id = $1 OR is_system_role = true) AND is_active = true ORDER BY hierarchy_level`,
                tenantId
              )
            : await prisma.$queryRawUnsafe<IAdminRole[]>(
                `SELECT * FROM admin_roles WHERE tenant_id IS NULL AND is_active = true ORDER BY hierarchy_level`
              );
        return rows;
    }

    async findDefault(tenantId?: string | null): Promise<IAdminRole | null> {
        const rows = tenantId
            ? await prisma.$queryRawUnsafe<IAdminRole[]>(
                `SELECT * FROM admin_roles WHERE is_default = true AND is_active = true AND tenant_id = $1 LIMIT 1`,
                tenantId
              )
            : await prisma.$queryRawUnsafe<IAdminRole[]>(
                `SELECT * FROM admin_roles WHERE is_default = true AND is_active = true AND tenant_id IS NULL LIMIT 1`
              );
        return rows[0] || null;
    }

    async countUsersWithRole(roleId: string): Promise<number> {
        // role_assignments table references roles by role_id; admin_roles are separate
        // check via raw query on role_assignments where role_id matches an admin_role
        const rows = await prisma.$queryRawUnsafe<{ count: string }[]>(
            `SELECT COUNT(*) as count FROM role_assignments WHERE role_id = $1::uuid`,
            roleId
        );
        return parseInt(rows[0]?.count || '0', 10);
    }

    async clearDefaultForTenant(excludeRoleId: string, tenantId: string | null): Promise<void> {
        if (tenantId) {
            await prisma.$executeRawUnsafe(
                `UPDATE admin_roles SET is_default = false WHERE is_default = true AND id != $1::uuid AND tenant_id = $2::uuid`,
                excludeRoleId, tenantId
            );
        } else {
            await prisma.$executeRawUnsafe(
                `UPDATE admin_roles SET is_default = false WHERE is_default = true AND id != $1::uuid AND tenant_id IS NULL`,
                excludeRoleId
            );
        }
    }
}
