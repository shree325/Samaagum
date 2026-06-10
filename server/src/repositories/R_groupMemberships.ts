import pool from '../config/database';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IGroupMembership, IR_groupMemberships } from './IR_groupMemberships';

export class R_groupMemberships extends PostgresBaseRepository<IGroupMembership> implements IR_groupMemberships {
    constructor() {
        super('group_memberships', 'membership_id');
    }

    async joinGroup(membership: IGroupMembership): Promise<IGroupMembership> {
        const existsQuery = `SELECT * FROM group_memberships WHERE group_id = $1 AND user_id = $2`;
        const { rows: existing } = await pool.query(existsQuery, [membership.group_id, membership.user_id]);
        
        if (existing.length > 0) {
            const query = `
                UPDATE group_memberships 
                SET state = $1, responded_at = $2 
                WHERE group_id = $3 AND user_id = $4 
                RETURNING *
            `;
            const { rows } = await pool.query(query, [
                membership.state, 
                new Date(),
                membership.group_id, 
                membership.user_id
            ]);
            return rows[0];
        }

        return this.create(membership);
    }

    async leaveGroup(groupId: string, userId: string): Promise<boolean> {
        const query = `
            UPDATE group_memberships 
            SET state = 'left' 
            WHERE group_id = $1 AND user_id = $2
        `;
        const result = await pool.query(query, [groupId, userId]);
        return (result.rowCount ?? 0) > 0;
    }

    async approveMembership(groupId: string, userId: string): Promise<IGroupMembership | null> {
        const query = `
            UPDATE group_memberships 
            SET state = 'active', responded_at = $1 
            WHERE group_id = $2 AND user_id = $3 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [new Date(), groupId, userId]);
        return rows[0] || null;
    }

    async rejectMembership(groupId: string, userId: string): Promise<IGroupMembership | null> {
        const query = `
            UPDATE group_memberships 
            SET state = 'rejected', responded_at = $1 
            WHERE group_id = $2 AND user_id = $3 
            RETURNING *
        `;
        const { rows } = await pool.query(query, [new Date(), groupId, userId]);
        return rows[0] || null;
    }

    async getGroupMembers(groupId: string): Promise<IGroupMembership[]> {
        const query = `SELECT * FROM group_memberships WHERE group_id = $1 AND state = 'active'`;
        const { rows } = await pool.query(query, [groupId]);
        return rows;
    }

    async getUserGroups(userId: string): Promise<IGroupMembership[]> {
        const query = `SELECT * FROM group_memberships WHERE user_id = $1 AND state = 'active'`;
        const { rows } = await pool.query(query, [userId]);
        return rows;
    }

    async isMember(groupId: string, userId: string): Promise<boolean> {
        const query = `
            SELECT 1 FROM group_memberships 
            WHERE group_id = $1 AND user_id = $2 AND state = 'active'
            LIMIT 1
        `;
        const { rowCount } = await pool.query(query, [groupId, userId]);
        return (rowCount ?? 0) > 0;
    }
}
