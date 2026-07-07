// @ts-nocheck
import prisma from '../config/prisma';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IRole, IR_roles } from './IR_roles';

export class R_roles extends PostgresBaseRepository<IRole> implements IR_roles {
    constructor() {
        super('roles', 'role_id');
    }

    async findByKey(key: string): Promise<IRole | null> {
        const query = `SELECT * FROM roles WHERE key = $1 LIMIT 1`;
        const { rows } = await prisma.query(query, [key]);
        return rows[0] || null;
    }

    async getRoleKey(roleId: string): Promise<string | null> {
        const query = `SELECT key FROM roles WHERE id = $1::uuid LIMIT 1`;
        const { rows } = await prisma.query(query, [roleId]);
        return rows[0]?.key || null;
    }

    async getBaselineCapabilitiesByKey(key: string): Promise<any | null> {
        const query = `SELECT baseline_capabilities FROM roles WHERE key = $1 LIMIT 1`;
        const { rows } = await prisma.query(query, [key]);
        return rows[0]?.baseline_capabilities || null;
    }
}

