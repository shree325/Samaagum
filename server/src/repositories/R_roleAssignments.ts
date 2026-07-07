// @ts-nocheck
import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IRoleAssignment, IR_roleAssignments } from './IR_roleAssignments';

export class R_roleAssignments extends PostgresBaseRepository<IRoleAssignment> implements IR_roleAssignments {
    constructor() {
        super('role_assignments', 'assignment_id');
    }

    async assignRole(assignment: IRoleAssignment): Promise<IRoleAssignment> {
        const existsQuery = `
            SELECT * FROM role_assignments 
            WHERE user_id = $1 AND role_id = $2 AND scope_entity_id = $3
        `;
        const { rows: existing } = await prisma.query(existsQuery, [
            assignment.user_id, assignment.role_id, assignment.scope_entity_id
        ]);

        if (existing.length > 0) {
            return existing[0];
        }

        return this.create(assignment);
    }

    async removeRole(userId: string, roleId: string, scopeEntityId: string): Promise<boolean> {
        const query = `
            DELETE FROM role_assignments
            WHERE user_id = $1 AND role_id = $2 AND scope_entity_id = $3
        `;
        const result = await prisma.query(query, [userId, roleId, scopeEntityId]);
        return (result.rowCount ?? 0) > 0;
    }

    async getUserRoles(userId: string): Promise<IRoleAssignment[]> {
        const query = `SELECT * FROM role_assignments WHERE user_id = $1`;
        const { rows } = await prisma.query(query, [userId]);
        return rows;
    }

    async getEntityRoles(scopeEntityId: string): Promise<IRoleAssignment[]> {
        const query = `SELECT * FROM role_assignments WHERE scope_entity_id = $1`;
        const { rows } = await prisma.query(query, [scopeEntityId]);
        return rows;
    }

    async hasRole(userId: string, roleId: string, scopeEntityId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM role_assignments 
            WHERE user_id = $1 AND role_id = $2 AND scope_entity_id = $3
            LIMIT 1
        `;
        const { rowCount } = await prisma.query(query, [userId, roleId, scopeEntityId]);
        return (rowCount ?? 0) > 0;
    }

    async getActiveRoleAssignment(userId: string): Promise<string | null> {
        const query = `
            SELECT role_id FROM role_assignments 
            WHERE user_id = $1::uuid 
              AND (expires_at IS NULL OR expires_at > now()) 
            LIMIT 1
        `;
        const { rows } = await prisma.query(query, [userId]);
        return rows[0]?.role_id || null;
    }

    async getPlatformRoleKeysForUser(userId: string): Promise<string[]> {
        const query = `
            SELECT r.key FROM role_assignments ra
            JOIN roles r ON r.id = ra.role_id
            WHERE ra.user_id = $1::uuid
              AND r.level = 'platform'
              AND (ra.expires_at IS NULL OR ra.expires_at > now())
        `;
        const { rows } = await prisma.query(query, [userId]);
        return rows.map(r => r.key);
    }

    async getDirectAssignments(userId: string, targetEntityId: string): Promise<any[]> {
        const query = `
            SELECT r.baseline_capabilities, ra.restrictions FROM role_assignments ra
            JOIN roles r ON r.id = ra.role_id
            WHERE ra.user_id = $1::uuid
              AND ra.scope_entity_id = $2::uuid
              AND (ra.expires_at IS NULL OR ra.expires_at > now())
        `;
        const { rows } = await prisma.query(query, [userId, targetEntityId]);
        return rows;
    }

    async deletePlatformRoleAssignments(userId: string): Promise<void> {
        const query = `
            DELETE FROM role_assignments 
            WHERE user_id = $1::uuid AND scope_entity_id IS NULL
        `;
        await prisma.query(query, [userId]);
    }

    async assignPlatformRole(tenantId: string, userId: string, roleId: string): Promise<void> {
        const query = `
            INSERT INTO role_assignments (id, tenant_id, user_id, role_id, created_at, updated_at)
            VALUES (gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid, now(), now())
        `;
        await prisma.query(query, [tenantId, userId, roleId]);
    }
}


