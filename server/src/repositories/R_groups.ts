import pool from '../config/database';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IGroup, IR_groups } from './IR_groups';

export class R_groups extends PostgresBaseRepository<IGroup> implements IR_groups {
    constructor() {
        super('groups', 'entity_id');
    }

    async findByJoinMode(joinMode: 'open' | 'approval_required' | 'invite_only'): Promise<IGroup[]> {
        const query = `SELECT * FROM groups WHERE join_mode = $1`;
        const { rows } = await pool.query(query, [joinMode]);
        return rows;
    }

    async getListedGroups(): Promise<IGroup[]> {
        const query = `SELECT * FROM groups WHERE listed = true`;
        const { rows } = await pool.query(query);
        return rows;
    }
}
