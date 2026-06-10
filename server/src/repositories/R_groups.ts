import pool from '../config/database';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IGroup, IR_groups } from './IR_groups';

export class R_groups extends PostgresBaseRepository<IGroup> implements IR_groups {
    constructor() {
        super('groups', 'entity_id');
    }

    async findBySlug(slug: string): Promise<IGroup | null> {
        const query = `SELECT * FROM groups WHERE slug = $1 LIMIT 1`;
        const { rows } = await pool.query(query, [slug]);
        return rows[0] || null;
    }

    async getPublicGroups(): Promise<IGroup[]> {
        const query = `SELECT * FROM groups WHERE scope = 'public' AND listed = true`;
        const { rows } = await pool.query(query);
        return rows;
    }
}
