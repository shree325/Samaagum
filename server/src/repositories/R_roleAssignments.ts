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
}
