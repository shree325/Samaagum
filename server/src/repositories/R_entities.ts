import pool from '../config/database';
import { PostgresBaseRepository } from './PostgresBaseRepository';
import { IEntity, IR_entities } from './IR_entities';

export class R_entities extends PostgresBaseRepository<IEntity> implements IR_entities {
    constructor() {
        super('entities', 'entity_id');
    }

    async getChildren(parentEntityId: string): Promise<IEntity[]> {
        const query = `SELECT * FROM entities WHERE parent_entity_id = $1`;
        const { rows } = await pool.query(query, [parentEntityId]);
        return rows;
    }

    async findByType(entityType: string): Promise<IEntity[]> {
        const query = `SELECT * FROM entities WHERE entity_type = $1`;
        const { rows } = await pool.query(query, [entityType]);
        return rows;
    }

    async findByTenant(tenantId: string): Promise<IEntity[]> {
        const query = `SELECT * FROM entities WHERE tenant_id = $1`;
        const { rows } = await pool.query(query, [tenantId]);
        return rows;
    }
}
